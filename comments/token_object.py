import time
import uuid

# 2 hours in Seconds
EXPIRE_TIME = 60 * 60 * 2

class TokenObject():
    def __init__(self):
        self._expire_time = time.time() + EXPIRE_TIME
        self._string = str(uuid.uuid4())

    def __str__(self):
        return self._string

    def is_valid(self, other):
        print "times", time.time(), self._expire_time
        if time.time() > self._expire_time:
             return False

        print other, self._string
        return other == self._string
