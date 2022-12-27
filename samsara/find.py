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
        return 2 ** 32
    return pos


def find_element(s: str, el: str, start_pos: int) -> (int, int):
    # i = doc.find("<table", i)
    # end_table_pos = doc.find("</table", i)
    start = s.find('<' + el, start_pos)
    if start == -1:
        return start, start

    return start, s.find('</' + el, start + 1) + len(el) + 3

def table_range(s: str, start_pos: int) -> (int, int):
    return find_element(s, 'table',start_pos )


def tr_range(s: str, start_pos: int) -> (int, int):
    return find_element(s, 'tr', start_pos)


def th_range(s: str, start_pos: int) -> (int, int):
    return find_element(s, 'th', start_pos)


def td_range(s: str, start_pos: int) -> (int, int):
    return find_element(s, 'td', start_pos)
