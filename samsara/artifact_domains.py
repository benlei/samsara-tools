import html


def trim_doc(doc: str) -> str:
    start = doc.rfind(">List of Domains of Blessing<")
    start = doc.find("<table", start)
    end = doc.find("</table", start) + len("</table>")

    return doc[start:end]


def load_artifact_domains(doc: str) -> dict:
    row_end = 0
    result = {}
    while row_end < len(doc):
        row_start = doc.find("<tr", row_end)
        if row_start == -1:
            break

        row_end = doc.find("</tr", row_start) + 1
        result.update(
            parse_artifact_domain_row(doc[row_start : row_end + len("</tr>")])
        )
    return result


def parse_artifact_domain_row(doc: str) -> dict:
    def parse_domain_name() -> str:
        domain_name_start = doc.find("<td")
        title_start_pos = doc.find('title="', domain_name_start) + len('title="')
        title_end_pos = doc.find('"', title_start_pos)
        return html.unescape(doc[title_start_pos:title_end_pos])

    if doc.find("static.wikia.") == -1:
        return {}

    artifacts = parse_artifacts(get_artifact_cell(doc))

    if len(artifacts):
        return {parse_domain_name(): artifacts}

    return {}


def get_artifact_cell(doc: str) -> str:
    def is_artifact_subdoc(subdoc: str) -> bool:
        return subdoc.count("<img ") == subdoc.count("<a ") and subdoc.count("<a ") == 4

    end_pos = 0
    while end_pos < len(doc):
        if (start_pos := doc.find("<td", end_pos)) == -1:
            break

        end_pos = doc.find("</td", start_pos)
        if is_artifact_subdoc(doc[start_pos:end_pos]):
            return doc[start_pos:end_pos]

    return ""


def parse_artifacts(doc: str) -> list:
    result = []
    end_pos = 0
    while end_pos < len(doc):
        start_pos = doc.find('title="', end_pos)
        if start_pos == -1:
            break

        start_pos += len('title="')
        end_pos = doc.find('"', start_pos)
        result.append(html.unescape(doc[start_pos:end_pos]))

    return result
