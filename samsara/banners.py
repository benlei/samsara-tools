import datetime
import html
import re
from collections import defaultdict
from typing import Optional

from samsara.fandom import rescale_image_url
from samsara.find import findi


def trim_doc(doc: str) -> str:
    """
    Removes unnecessary information from the doc so that it can focus solely on banner information
    :param doc: the doc string
    :return: a trimmed version of the doc
    """
    start = doc.rindex(">Wishes by Version<")
    end = doc.rindex(">Wishes by Type<")
    doc = doc[start:end]
    return doc


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
        "5": defaultdict(lambda: dict(versions=[], dates=[])),
        "4": defaultdict(lambda: dict(versions=[], dates=[])),
    }

    weapons = {
        "5": defaultdict(lambda: dict(versions=[], dates=[])),
        "4": defaultdict(lambda: dict(versions=[], dates=[])),
    }

    end_pos = 0
    while end_pos < len(doc):
        if (version := get_version(end_pos)) is None:
            break

        start_pos = doc.find("<table", end_pos)
        end_pos = doc.find("</table", start_pos)

        parse_banners_from_version(
            doc=doc[start_pos : end_pos + len("</table>")],
            version=version,
            characters=characters,
            weapons=weapons,
        )

    return dict(characters=characters, weapons=weapons)


def parse_banners_from_version(
    doc: str,
    version: str,
    characters: dict,
    weapons: dict,
):
    def banner_end_pos(start: int) -> int:
        return findi(doc, "</tr", start)

    def is_finished_parsing_version(start: int) -> bool:
        return banner_end_pos(start) > len(doc)

    def is_weapon_banner(start: int) -> bool:
        return findi(doc, "Epitome Invocation", start) < banner_end_pos(start)

    def is_row_empty(start: int) -> bool:
        return get_nearest_5star_card_pos(doc, start, banner_end_pos(start)) == float(
            "inf"
        )

    def get_banner_date_range(start: int) -> str:
        date_range_start_pos = doc.find('data-sort-value="', start) + len(
            'data-sort-value="'
        )
        date_range_end_pos = doc.find('"', date_range_start_pos)
        return doc[date_range_start_pos:date_range_end_pos]

    last_character_date_range = None
    last_weapon_date_range = None
    character_banner_count = 0
    weapon_banner_count = 0
    start_pos = 0
    while start_pos < len(doc):
        if is_finished_parsing_version(start_pos):
            break

        if is_row_empty(start_pos):
            start_pos = banner_end_pos(start_pos) + 1
            continue

        # start going through the cards (char/weap)!
        if is_weapon_banner(start_pos):
            if get_banner_date_range(start_pos) != last_weapon_date_range:
                weapon_banner_count += 1
                last_weapon_date_range = get_banner_date_range(start_pos)

            parse_banner(
                doc=doc[start_pos : banner_end_pos(start_pos)],
                version=f"{version}.{weapon_banner_count}",
                store=weapons,
                date=get_banner_date_range(start_pos),
            )
        else:
            if get_banner_date_range(start_pos) != last_character_date_range:
                character_banner_count += 1
                last_character_date_range = get_banner_date_range(start_pos)

            parse_banner(
                doc=doc[start_pos : banner_end_pos(start_pos)],
                version=f"{version}.{character_banner_count}",
                store=characters,
                date=get_banner_date_range(start_pos),
            )

        start_pos = banner_end_pos(start_pos) + 1


FiveStarMatch = re.compile(r"card[a-zA-Z\-_]*5")
FourStarMatch = re.compile(r"card[a-zA-Z\-_]*4")


def get_nearest_5star_card_pos(
    doc: str, start_pos: int, end_pos: int = None
) -> float | int:
    match = FiveStarMatch.search(doc, start_pos, end_pos if end_pos else len(doc))
    if match is None:
        return float("inf")

    return match.start()


def get_nearest_4star_card_pos(
    doc: str, start_pos: int, end_pos: int = None
) -> float | int:
    match = FourStarMatch.search(doc, start_pos, end_pos if end_pos else len(doc))
    if match is None:
        return float("inf")

    return match.start()


def parse_banner(
    doc: str,
    version: str,
    store: dict,
    date: str,
):
    def is_finished_parsing_banner(five_pos: int, four_pos: int) -> bool:
        return min(five_pos, four_pos) > len(doc)

    def add_version(stars: str, name: str, img_url: str):
        if version not in store[stars][name]["versions"]:
            store[stars][name]["versions"].append(version)
            store[stars][name]["dates"].append(date)

        if "image" not in store[stars][name]:
            store[stars][name]["image"] = rescale_image_url(img_url, 100)

    def get_stars(five_pos, four_pos) -> str:
        if five_pos < four_pos:
            return "5"
        return "4"

    def get_img_url(start: int) -> str:
        img_pos_start = doc.find("https://static.wikia", start)
        img_pos_end = doc.find('"', img_pos_start)
        img_url = doc[img_pos_start:img_pos_end]
        return img_url

    def get_name(start: int) -> str:
        title_pos_start = doc.find("title=", start) + len('title="')
        title_pos_end = doc.find('"', title_pos_start)
        title = html.unescape(doc[title_pos_start:title_pos_end])
        return title

    start_pos = 0
    while start_pos < len(doc):
        five_star_pos = get_nearest_5star_card_pos(doc, start_pos)
        four_star_pos = get_nearest_4star_card_pos(doc, start_pos)

        # there are no more char/weaps
        if is_finished_parsing_banner(five_star_pos, four_star_pos):
            break

        # advance the pointer
        start_pos = min(five_star_pos, four_star_pos) + 1
        add_version(
            stars=get_stars(five_star_pos, four_star_pos),
            name=get_name(start_pos),
            img_url=get_img_url(start_pos),
        )


def minify(data: dict) -> dict:
    result = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for resource_type, stars in data.items():
        for star, resources in stars.items():
            for resource_name, resource in resources.items():
                result[resource_type][star][resource_name] = resource["versions"]
    return result


def get_start_date(date: str) -> str:
    return date[
        -len("2022-10-14 18:00:00") : -len("2022-10-14 18:00:00") + len("yyyy-mm-dd")
    ]


def get_end_date(date: str) -> str:
    start_date = get_start_date(date)
    end_date = date[0 : len("2022-10-14")]

    if start_date == end_date:
        end_date = (
            datetime.datetime.strptime(start_date, "%Y-%m-%d")
            + datetime.timedelta(days=21)
        ).strftime("%Y-%m-%d")

    return end_date


def summary_minify(data: dict) -> dict:
    result = defaultdict(lambda: defaultdict(lambda: defaultdict()))
    for resource_type, stars in data.items():
        for star, resources in stars.items():
            for resource_name, resource in resources.items():
                result[resource_type][star][resource_name] = dict(
                    versions=resource["versions"],
                    dates=[
                        dict(
                            start=get_start_date(date),
                            end=get_end_date(date),
                        )
                        for date in resource["dates"]
                    ],
                )
    return result
