import html

from samsara import fandom, htmldoc


def trim_doc(doc: str) -> str:
    start = doc.rfind(">List of Artifact Sets<")
    start = doc.find("<table", start)
    end = doc.find("</table", start) + len("</table>")

    return doc[start:end]


def load_5star_artifacts(doc: str) -> dict:
    def is_5star_artifact_row(start, end) -> bool:
        return doc.find(">4-5", start, end) != -1

    result = {}
    end_pos = 0
    while end_pos < len(doc):
        start_pos = doc.find("<tr", end_pos)
        if start_pos == -1:
            break

        end_pos = doc.find("</tr", start_pos)
        if not is_5star_artifact_row(start_pos, end_pos):
            continue

        result.update(parse_artifact_row(doc[start_pos:end_pos]))

    return result


def parse_artifact_row(doc: str) -> dict:
    name_start_pos = doc.find('title="') + len('title="')
    name_end_pos = doc.find('"', name_start_pos)

    circ_start_pos = doc.find('src="https://static.wikia', doc.rfind("<img")) + len(
        'src="'
    )
    circ_end_pos = doc.find('"', circ_start_pos)

    desc_start_pos = doc.find("<td", circ_end_pos)
    desc_end_pos = doc.find("</td", desc_start_pos)

    return {
        html.unescape(doc[name_start_pos:name_end_pos]): {
            "image": fandom.rescale_image_url(doc[circ_start_pos:circ_end_pos], 50),
            "description": htmldoc.remove_tags(
                doc[desc_start_pos:desc_end_pos].replace("<br", "\n<br")
            ).strip(),
        }
    }


def minify(data: dict) -> dict:
    return {
        artifact_name: artifact["description"]
        for artifact_name, artifact in data.items()
    }
