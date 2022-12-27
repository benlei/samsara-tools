from typing import Optional


def findi(s: str, substr: str, start: Optional[int]) -> int:
    """
    Tries to find the substr in the str, otherwise returns a big number
    :param s: the string
    :param substr: the substring to find
    :param start: the start position of the string
    :return: the position of the substr in s, or a really large number if it can't be found
    """
    pos = s.find(substr, start)
    if pos == -1:
        return 2**32
    return pos
