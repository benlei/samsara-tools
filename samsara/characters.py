import html

from samsara import fandom


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

        result.update(parse_character_data(doc[row_start:row_end]))

    return result


def parse_character_data(doc: str) -> dict:
    def has_data() -> bool:
        return doc.find("static.wikia.") != -1 and doc.find("title=") != -1

    if not has_data():
        return {}

    title_pos = doc.find("title=") + len('title="')
    character_name = html.unescape(doc[title_pos : doc.find('"', title_pos)])

    image_pos = doc.find("https://static.wikia")
    img_url = fandom.rescale_image_url(doc[image_pos : doc.find('"', image_pos)], 100)

    return {character_name: img_url}


def minify(data: dict):
    return sorted(data.keys())
