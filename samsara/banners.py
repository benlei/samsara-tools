import html
import re
from collections import defaultdict
from typing import Optional


def find_inverted(s: str, substr: str, start: Optional[int]) -> int:
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


def load_banners(doc: str) -> dict:
    """
    Loads up the wish history based on the input doc
    :param doc: the wish history doc
    :return: a dictionary with a characters and weapons field
    """

    def get_version(start: int) -> Optional[str]:
        version_pos = doc.find(">Version", start)

        # it's the end
        if version_pos == -1:
            return None

        end_version_pos = doc.find("<", version_pos)
        return doc[version_pos:end_version_pos].split(" ")[1]

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

        i = doc.find("<table", i)
        end_table_pos = doc.find("</table", i)

        parse_banners_from_version(
            doc=doc,
            start_pos=i,
            end_pos=end_table_pos,
            version=version,
            characters=characters,
            weapons=weapons,
        )

        i = end_table_pos
    return dict(characters=characters, weapons=weapons)


def parse_banners_from_version(
    doc: str,
    start_pos: int,
    end_pos: int,
    version: str,
    characters: dict,
    weapons: dict,
):
    def banner_end_pos() -> int:
        return find_inverted(doc, "</tr", start_pos)

    def is_finished_parsing_version() -> bool:
        return banner_end_pos() > end_pos

    def is_weapon_banner() -> bool:
        return find_inverted(doc, "Epitome Invocation", start_pos) < banner_end_pos()

    def is_row_empty() -> bool:
        return doc.find("card_5", start_pos, banner_end_pos()) == -1

    def get_banner_date_range() -> str:
        date_range_start_pos = doc.find('data-sort-value="', start_pos) + len(
            'data-sort-value="'
        )
        date_range_end_pos = doc.find('"', date_range_start_pos)
        return doc[date_range_start_pos:date_range_end_pos]

    last_character_date_range = None
    last_weapon_date_range = None
    character_banner_count = 0
    weapon_banner_count = 0
    while start_pos < end_pos:
        # it's the end!
        if is_finished_parsing_version():
            break

        if is_row_empty():
            start_pos = banner_end_pos() + 1
            continue

        # start going through the cards (char/weap)!
        if is_weapon_banner():
            if get_banner_date_range() != last_weapon_date_range:
                weapon_banner_count += 1
                last_weapon_date_range = get_banner_date_range()

            parse_banner(
                doc=doc,
                start_pos=start_pos,
                end_pos=banner_end_pos(),
                version=f"{version}.{weapon_banner_count}",
                store=weapons,
            )
        else:
            if get_banner_date_range() != last_character_date_range:
                character_banner_count += 1
                last_character_date_range = get_banner_date_range()

            parse_banner(
                doc=doc,
                start_pos=start_pos,
                end_pos=banner_end_pos(),
                version=f"{version}.{character_banner_count}",
                store=characters,
            )

        start_pos = banner_end_pos() + 1


def parse_banner(
    doc: str,
    start_pos: int,
    end_pos: int,
    version: str,
    store: dict,
):
    def is_finished_parsing_banner(five_star_pos: int, four_star_pos: int) -> bool:
        return min(five_star_pos, four_star_pos) > end_pos

    def add_version(stars: str, name: str, img_url: str):
        if version not in store[stars][name]["versions"]:
            store[stars][name]["versions"].append(version)

        if "image" not in store[stars][name]:
            store[stars][name]["image"] = img_url

    def get_stars(five_star_pos, four_star_pos) -> str:
        if five_star_pos < four_star_pos:
            return "5"
        return "4"

    def get_img_url() -> str:
        img_pos_start = doc.find("https://static.wikia", start_pos)
        img_pos_end = doc.find('"', img_pos_start)
        img_url = doc[img_pos_start:img_pos_end]
        return img_url

    def get_name() -> str:
        title_pos_start = doc.find("title=", start_pos) + len('title="')
        title_pos_end = doc.find('"', title_pos_start)
        title = html.unescape(doc[title_pos_start:title_pos_end])
        return title

    while start_pos < end_pos:
        five_star_pos = find_inverted(doc, "card_5", start_pos)
        four_star_pos = find_inverted(doc, "card_4", start_pos)

        # there are no more char/weaps
        if is_finished_parsing_banner(five_star_pos, four_star_pos):
            break

        # advance the pointer
        start_pos = min(five_star_pos, four_star_pos) + 1
        add_version(
            stars=get_stars(five_star_pos, four_star_pos),
            name=get_name(),
            img_url=get_img_url(),
        )


def trim_doc(doc: str) -> str:
    """
    Removes unnecessary information from the doc so that it can focus solely on banner information
    :param doc: the doc string
    :return: a trimmed version of the doc
    """
    start = doc.rindex("Wishes by Version")
    end = doc.rindex("Wishes by Type")
    doc = doc[start:end]
    return doc


def filename(name: str) -> str:
    result = name.replace(" ", "-")
    result = re.sub(r"[^a-zA-Z0-9\-]", "", result)
    return re.sub(r"--+", "-", result)


def minify(data: dict) -> dict:
    result = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for resourceType, stars in data.items():
        for star, resources in stars.items():
            for resourceName, resource in resources.items():
                result[resourceType][star][resourceName] = resource["versions"]
    return result
