import fcntl
import os
from contextlib import contextmanager

LOCK_FILE = "/tmp/sicksense_safari.lock"

@contextmanager
def acquire_safari_lock():
    fd = os.open(LOCK_FILE, os.O_CREAT | os.O_RDWR)
    try:
        fcntl.flock(fd, fcntl.LOCK_EX)
        yield
    finally:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)
