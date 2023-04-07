import json
from collections import defaultdict
from datetime import datetime
from distutils.version import StrictVersion
from typing import TypedDict

from samsara.fandom import QueryResponse, Page, Category

CategoryVersionPrefix = "Category:Released in Version "
CategoryFeaturedPrefix = "Category:Features "


class BannerDates(TypedDict):
    start: str
    end: str


class BannerHistory(TypedDict):
    name: str
    versions: list[str]
    dates: list[BannerDates]


class BannerDataset(TypedDict):
    five_star_characters: list[BannerHistory]
    four_star_characters: list[BannerHistory]
    five_star_weapons: list[BannerHistory]
    four_star_weapons: list[BannerHistory]


def get_valid_date_or_blank(date: str) -> str:
    try:
        datetime.strptime(date, "%Y-%m-%d")
        return date
    except:
        return ""


def get_version_from_page(p: Page) -> str:
    versions = [
        c for c in p["categories"] if c["title"].startswith(CategoryVersionPrefix)
    ]

    if len(versions) != 1:
        raise Exception(f"Expected 1 version result, found {len(versions)}")

    return versions[0]["title"][len(CategoryVersionPrefix) :]


def is_banner_page(page: Page) -> bool:
    return page["title"].find("/") != -1


def get_banner_date(p: Page) -> str:
    return p["title"].split("/")[1]


def categories_contain_featured(p: Page, featured: str) -> bool:
    return (
        len(
            [
                c
                for c in p["categories"]
                if c["title"] == f"{CategoryFeaturedPrefix}{featured}"
            ]
        )
        > 0
    )


def get_featured_versions(
    event_wishes_qr: QueryResponse,
    featured: str,
) -> list[str]:
    result: list[str] = []

    page: Page
    for page in event_wishes_qr["query"]["pages"].values():
        if not is_banner_page(page):
            continue

        if categories_contain_featured(page, featured):
            result.append(get_version_from_page(page))

    result.sort(key=StrictVersion)
    return result


def get_next_banner_date(event_wishes_qr: QueryResponse, start_date: str) -> str:
    result = [
        get_banner_date(p)
        for p in event_wishes_qr["query"]["pages"].values()
        if is_banner_page(p) and get_banner_date(p) > start_date
    ]

    if len(result) > 0:
        return result[0]
    return ""


def get_featured_dates(
    event_wishes_qr: QueryResponse,
    featured: str,
) -> list[BannerDates]:
    result: list[BannerDates] = []

    page: Page
    for page in event_wishes_qr["query"]["pages"].values():
        if not is_banner_page(page):
            continue

        if categories_contain_featured(page, featured):
            result.append(
                {
                    "start": get_valid_date_or_blank(get_banner_date(page)),
                    "end": get_valid_date_or_blank(
                        get_next_banner_date(event_wishes_qr, get_banner_date(page))
                    ),
                }
            )

    def get_banner_start_date(b: BannerDates) -> str:
        return b["start"]

    result.sort(key=get_banner_start_date)
    return result


def transform_data(
    event_wishes_qr: QueryResponse,
    five_star_characters_qr: QueryResponse,
    four_star_characters_qr: QueryResponse,
    five_star_weapons_qr: QueryResponse,
    four_star_weapons_qr: QueryResponse,
) -> BannerDataset:
    page: Page
    for page in five_star_characters_qr["query"]["pages"].values():
        print(page["title"])
        print(f"  {get_featured_versions(event_wishes_qr, page['title'])}")
        print(f"  {get_featured_dates(event_wishes_qr, page['title'])}")

    # strategy (example):
    # 1. setup separate character and weapon timeline (list)
    #     - sorted by its version and/or maybe its date, and with maybe
    #       its queryresponse (or some form of it)
    #     - non-dated ones should go to the end.
    #     - make sure to use the version parse library to compare:
    #       https://stackoverflow.com/questions/11887762/how-do-i-compare-version-numbers-in-python
    # 2. go through timeline and start filling out each banner history!
    pass
