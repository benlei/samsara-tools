import html


def trim_doc(doc: str) -> str:
    start = doc.rfind(">Playable Characters<")
    start = doc.find("<table", start)
    end = doc.find("</table", start) + len("</table>")

    return doc[start:end]


def load_characters(doc: str) -> dict:
    row_end = 0
    result = {}
    while row_end < len(doc):
        row_start = doc.find("<tr", row_end)
        if row_start == -1:
            break
        row_end = doc.find("</tr", row_start) + 1

        if doc.find("static.wikia.", row_start, row_end) == -1:
            continue

        # first column is all we really need
        if (title_pos := doc.find("title=", row_start, row_end)) == -1:
            continue

        title_pos += len('title="')
        character_name = html.unescape(doc[title_pos : doc.find('"', title_pos)])

        image_pos = doc.find("https://static.wikia", row_start, row_end)
        img_url = doc[image_pos : doc.find('"', image_pos)]
        result[character_name] = img_url

    return result
