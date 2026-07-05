# conftest.py — shared pytest setup for the backend suite.
#
# Rate limits are DISABLED by default for tests (the functional suites in
# test_demo.py / test_title_report.py make many rapid requests from the same
# fake client IP). The dedicated rate-limiter tests in test_security.py
# re-enable enforcement explicitly by monkeypatching main.RATE_LIMITS_DISABLED.
#
# This file is imported by pytest BEFORE any test module, so the env var is
# set before main.py is first imported.

import os

os.environ.setdefault("GOOGLE_API_KEY", "test-key")
os.environ["DISABLE_RATE_LIMITS"] = "1"
