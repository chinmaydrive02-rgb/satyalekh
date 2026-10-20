import asyncio
import os

import pytest

import acquire_anyror_vf7 as operator
from anyror_http import AnyRORFormError


def test_operator_input_reads_line_and_eof_stops(monkeypatch):
    for contents in (b"ABC123\n", b""):
        descriptor, writer = os.pipe()
        os.write(writer, contents)
        os.close(writer)
        with os.fdopen(descriptor) as stream:
            monkeypatch.setattr(operator.sys, "stdin", stream)
            if contents:
                assert asyncio.run(operator.user_answer()) == "ABC123"
            else:
                with pytest.raises(EOFError):
                    asyncio.run(operator.user_answer())


def test_operator_input_expires_without_leaving_a_blocked_thread(monkeypatch):
    descriptor, writer = os.pipe()
    original_wait = asyncio.wait_for
    async def short_wait(future, timeout):
        return await original_wait(future, 0.01)
    monkeypatch.setattr(operator.asyncio, "wait_for", short_wait)
    try:
        with os.fdopen(descriptor) as stream:
            monkeypatch.setattr(operator.sys, "stdin", stream)
            with pytest.raises(AnyRORFormError, match="expired"):
                asyncio.run(operator.user_answer())
    finally:
        os.close(writer)


def test_source_files_are_private_and_never_overwrite_an_existing_export(tmp_path):
    target = tmp_path / "source.html"
    operator.private_file(target, b"original source")
    assert target.stat().st_mode & 0o777 == 0o600
    with pytest.raises(FileExistsError):
        operator.private_file(target, b"replacement")
    assert target.read_bytes() == b"original source"
