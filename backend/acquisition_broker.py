"""Durable acquisition boundary. Tokens stay hashed; source facts are server parsed."""
import base64
import binascii
import hashlib
import io
import re
import secrets
from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from authentication import AuthenticatedUser


def owner_id(identity):
    if not isinstance(identity, AuthenticatedUser):
        raise HTTPException(401, "Sign in to retrieve records.")
    return valid_id(identity.user_id)


def valid_id(value):
    try:
        if not isinstance(value, str) or len(value) > 36:
            raise ValueError('id')
        return str(UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(422, "Invalid acquisition identifier.") from None


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def decode_payload(value, limit, image=False):
    if not isinstance(value, str) or len(value) > ((limit + 2) // 3) * 4:
        raise HTTPException(413, "Acquisition attachment is too large.")
    try:
        raw = base64.b64decode(value, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(422, "Invalid acquisition attachment.") from None
    if not raw or len(raw) > limit:
        raise HTTPException(413, "Acquisition attachment is too large or empty.")
    if image and not (raw.startswith(b'\x89PNG\r\n\x1a\n') or raw.startswith(b'\xff\xd8\xff')
                      or raw.startswith((b'GIF87a', b'GIF89a'))
                      or (raw.startswith(b'RIFF') and raw[8:12] == b'WEBP')):
        raise HTTPException(422, "CAPTCHA must be a raster image.")
    if image:
        try:
            from PIL import Image
            with Image.open(io.BytesIO(raw)) as picture:
                if picture.width > 4096 or picture.height > 1024 or picture.width * picture.height > 1048576:
                    raise ValueError('dimensions')
                if picture.format not in {'PNG', 'JPEG', 'GIF', 'WEBP'} or getattr(picture, 'n_frames', 1) != 1:
                    raise ValueError('format')
                picture.verify()
        except Exception:
            raise HTTPException(422, "CAPTCHA image is invalid or exceeds the image limit.") from None
    return raw


def verify_requested_source(source, requested):
    from anyror_vf7_reader import read_anyror_vf7_html
    from anyror_matching import _find_best_option, _normalize_survey
    from local_document_reader import LocalDocumentError
    try:
        parsed = read_anyror_vf7_html(source)
        actual = parsed['source_record']['locations']
        for field in ('district', 'taluka', 'village'):
            target = requested[field]
            if field == 'village':
                target = re.sub(r'\s+-\s+[0-9૦-૯]{3}$', '', target)
            if _find_best_option([('actual', actual[field])], target) != 'actual':
                raise ValueError('identity')
        if _normalize_survey(parsed['survey_no']) != _normalize_survey(requested['survey_no']):
            raise ValueError('identity')
    except (LocalDocumentError, ValueError, KeyError, TypeError):
        raise HTTPException(422, "The returned VF-7 does not match the requested parcel or is incomplete.") from None
    return parsed


class AcquisitionBroker:
    def __init__(self, sb):
        self.sb = sb

    def call(self, action, **args):
        if self.sb is None:
            raise HTTPException(503, "Record retrieval storage is unavailable.")
        try:
            data = self.sb.rpc('acquisition_action', {'action': action, 'args': args}).execute().data
        except Exception:
            raise HTTPException(503, "Record retrieval storage is unavailable. Check this request before retrying.") from None
        if not isinstance(data, dict):
            raise HTTPException(503, "Record retrieval storage returned an invalid response.")
        if data.get('error'):
            raise HTTPException(int(data.get('status', 409)), data['error'])
        return data

    def register(self):
        worker_id = str(uuid4())
        token = secrets.token_urlsafe(32)
        code = ''.join(secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567') for _ in range(12))
        row = self.call('register', worker_id=worker_id, token_hash=digest(token), pairing_hash=digest(code))
        return dict(row, worker_id=worker_id, worker_token=token, pairing_code=code)

    def worker(self, action, worker_id, token, **args):
        if not isinstance(token, str) or not 40 <= len(token) <= 128:
            raise HTTPException(401, "Invalid retrieval device token.")
        return self.call(action, worker_id=valid_id(worker_id), token_hash=digest(token), **args)

    def complete(self, worker_id, token, job_id, lease_token, source_base64):
        # Verify lease before parsing. Final atomic transition verifies it again.
        original = self.worker('original', worker_id, token, job_id=valid_id(job_id), lease_token=lease_token)
        source = decode_payload(source_base64, 1024 * 1024)
        parsed = verify_requested_source(source, original['request'])
        from anyror_acquire import build_acquired_draft
        acquired_at = datetime.now(timezone.utc).isoformat()
        acquisition = {'source_sha256': hashlib.sha256(source).hexdigest(),
                       'sha256': hashlib.sha256(source).hexdigest(),
                       'retrieved_at': acquired_at, 'method': 'anyror_http_user_challenge',
                       'source_as_of': parsed['source_record'].get('source_as_of'),
                       'user_review_confirmed': False,
                       'source_url': 'https://anyror.gujarat.gov.in/Information_pages/Info712Details.aspx',
                       'certified_copy': False, 'parcel_identity_matched': True}
        draft = build_acquired_draft(parsed, acquisition)
        return self.worker('complete', worker_id, token, job_id=valid_id(job_id), lease_token=lease_token,
                           source_base64=source_base64, source_sha256=acquisition['sha256'],
                           result=draft, retrieved_at=acquired_at,
                           source_as_of=acquisition['source_as_of'])
