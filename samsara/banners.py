import html
from collections import defaultdict
from typing import Optional


def find_or_inf(s: str, substr: str, start: Optional[int]) -> int:
    pos = s.find(substr, start)
    if pos == -1:
        return 2 ** 32
    return pos


def load_banners(doc: str):
    def get_version(start: int) -> Optional[str]:
        version_pos = doc.find('>Version', start)

        # it's the end
        if version_pos == -1:
            return None

        end_version_pos = doc.find('<', version_pos)
        return doc[version_pos:end_version_pos].split(' ')[1]

    characters = {
        "5": defaultdict(lambda: dict(versions=[])),
        "4": defaultdict(lambda: dict(versions=[])),
    }

    weapons = {
        "5": defaultdict(lambda: dict(versions=[])),
        "4": defaultdict(lambda: dict(versions=[])),
    }

    i = 0
    while i < len(doc):
        if (version := get_version(i)) is None:
            break

        i = doc.find('<table', i)
        end_table_pos = doc.find('</table', i)

        parse_version_table(
            doc=doc,
            start_pos=i,
            end_pos=end_table_pos,
            version=version,
            characters=characters,
            weapons=weapons,
        )

        i = end_table_pos
    return dict(characters=characters, weapons=weapons)


def parse_version_table(doc, end_pos, start_pos, version, characters, weapons):
    def banner_end_pos() -> int:
        return find_or_inf(doc, '</tr', start_pos)

    def is_version_end() -> bool:
        return banner_end_pos() > end_pos

    def is_weapon_banner() -> bool:
        return find_or_inf(doc, 'Epitome Invocation', start_pos) < banner_end_pos()

    while start_pos < end_pos:
        # it's the end!
        if is_version_end():
            break

        # start going through the cards (char/weap)!
        if is_weapon_banner():
            parse_banner_row(
                doc=doc,
                start_pos=start_pos,
                end_pos=banner_end_pos(),
                version=version,
                store=weapons,
            )
        else:
            parse_banner_row(
                doc=doc,
                start_pos=start_pos,
                end_pos=banner_end_pos(),
                version=version,
                store=characters,
            )

        start_pos = banner_end_pos() + 1


def parse_banner_row(doc, end_pos, start_pos, version, store):
    def is_banner_end(five_star_pos, four_star_pos) -> bool:
        return min(five_star_pos, four_star_pos) > end_pos

    def add_version(stars: str, name: str, img_url: str):
        store[stars][name]["versions"].append(version)

        if "image" not in store[stars][name]:
            store[stars][name]["image"] = img_url

    def get_stars(five_star_pos, four_star_pos):
        stars = "4"
        if five_star_pos < four_star_pos:
            stars = "5"
        return stars

    def get_img_url():
        img_pos_start = doc.find('https://static.wikia', start_pos)
        img_pos_end = doc.find('"', img_pos_start)
        img_url = doc[img_pos_start:img_pos_end]
        return img_url

    def get_name():
        title_pos_start = doc.find('title=', start_pos) + len('title="')
        title_pos_end = doc.find('"', title_pos_start)
        title = html.unescape(doc[title_pos_start:title_pos_end])
        return title

    while start_pos < end_pos:
        five_star_pos = find_or_inf(doc, 'card_5', start_pos)
        four_star_pos = find_or_inf(doc, 'card_4', start_pos)

        # there are no more char/weaps
        if is_banner_end(five_star_pos, four_star_pos):
            break

        # advance the pointer
        start_pos = min(five_star_pos, four_star_pos) + 1
        add_version(
            stars=get_stars(five_star_pos, four_star_pos),
            name=get_name(),
            img_url=get_img_url(),
        )


def trim_doc(doc):
    start = doc.rindex('Wishes by Version')
    end = doc.rindex('Wishes by Type')
    doc = doc[start:end]
    return doc
