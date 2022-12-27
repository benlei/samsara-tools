def trim_doc(doc: str) -> str:
    start = doc.rfind(">Playable Characters<")
    start = doc.find("<table", start)
    end = doc.find("</table", start) + len("</table>")

    return doc[start:end]


def load_banners(doc: str) -> dict:

    pass
