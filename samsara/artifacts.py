def trim_doc(doc: str) -> str:
    start = doc.rfind(">List of Artifact Sets<")
    start = doc.find("<table", start)
    end = doc.find("</table", start) + len("</table>")

    return doc[start:end]


def load_artifacts(doc: str) -> dict:
    pass
