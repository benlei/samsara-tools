import bs4


def remove_tags(doc: str) -> str:
    return bs4.BeautifulSoup(doc, "html5lib").getText()
