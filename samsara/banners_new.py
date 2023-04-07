from typing import TypedDict

from samsara.fandom import QueryResponse


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


def transform_data(
    event_wishes_qr: QueryResponse,
    five_star_characters_qr: QueryResponse,
    four_star_characters_qr: QueryResponse,
    five_star_weapons_qr: QueryResponse,
    four_star_weapons_qr: QueryResponse,
) -> BannerDataset:
    # strategy (example):
    # 1. setup separate character and weapon timeline (list)
    #     - sorted by its version and/or maybe its date, and with maybe
    #       its queryresponse (or some form of it)
    #     - non-dated ones should go to the end.
    #     - make sure to use the version parse library to compare:
    #       https://stackoverflow.com/questions/11887762/how-do-i-compare-version-numbers-in-python
    # 2. go through timeline and start filling out each banner history!
    pass
