import copy
import re
from datetime import datetime
from distutils.version import StrictVersion
from typing import TypedDict, TypeVar

from samsara.fandom import QueryResponse, Page

T = TypeVar("T")


class BannerDates(TypedDict):
    start: str
    end: str


class BannerHistory(TypedDict):
    name: str
    versions: list[str]
    dates: list[BannerDates]


class BannerDataset(TypedDict):
    fiveStarCharacters: list[BannerHistory]
    fourStarCharacters: list[BannerHistory]
    fiveStarWeapons: list[BannerHistory]
    fourStarWeapons: list[BannerHistory]


def get_valid_date_or_blank(date: str) -> str:
    try:
        datetime.strptime(date, "%Y-%m-%d")
        return date
    except:
        return ""


def is_page_banner(page: Page) -> bool:
    return page["title"].find("/") != -1


def get_banner_date(p: Page) -> str:
    return p["title"].split("/")[1]


def append_unique(l: list[T], value: T):
    if value not in l:
        l.append(value)


class BannersParser:
    def __init__(self) -> None:
        self.CategoryVersionPrefix = "Category:Released in Version "
        self.CategoryFeaturedPrefix = "Category:Features "
        self.WeaponPagePrefix = "Epitome Invocation"

    def get_version_from_page(self, p: Page) -> str:
        def get_last_breadcrump() -> str:
            return p["title"][p["title"].find("/") + 1 :]

        def is_last_breadcrumb_a_version() -> bool:
            return bool(re.match(r"^\d+\.\d+$", get_last_breadcrump()))

        versions = [
            c
            for c in p["categories"]
            if c["title"].startswith(self.CategoryVersionPrefix)
        ]

        if len(versions) != 1:
            if is_last_breadcrumb_a_version():
                return get_last_breadcrump()

            raise Exception(f"Could not determine version from page {p['title']}")

        return versions[0]["title"][len(self.CategoryVersionPrefix) :]

    def is_page_weapon(self, page: Page) -> bool:
        return page["title"].startswith(self.WeaponPagePrefix)

    def page_contain_featured(self, p: Page, featured: str) -> bool:
        return (
            len(
                [
                    c
                    for c in p["categories"]
                    if c["title"] == f"{self.CategoryFeaturedPrefix}{featured}"
                ]
            )
            > 0
        )

    def get_pages_of_version(
        self,
        event_wishes_qr: QueryResponse,
        version: str,
        is_weapon: bool,
    ) -> list[Page]:
        return sorted(
            [
                p
                for p in event_wishes_qr["query"]["pages"].values()
                if is_page_banner(p)
                and self.is_page_weapon(p) == is_weapon
                and self.get_version_from_page(p) == version
            ],
            key=get_banner_date,
        )

    def get_minor_version(
        self,
        event_wishes_qr: QueryResponse,
        version: str,
        featured: str,
        is_weapon: bool,
    ) -> int:
        result = 0
        start_date = ""

        for p in self.get_pages_of_version(event_wishes_qr, version, is_weapon):
            if get_banner_date(p) != start_date:
                start_date = get_banner_date(p)
                result += 1

            if self.page_contain_featured(p, featured):
                break

        return result

    def filter_invalid_pages(
        self,
        event_wishes_qr: QueryResponse,
    ) -> QueryResponse:
        result = copy.deepcopy(event_wishes_qr)
        result["query"]["pages"] = {}

        for page in event_wishes_qr["query"]["pages"].values():
            if not is_page_banner(page):
                continue
            try:
                self.get_version_from_page(page)
                result["query"]["pages"][page["pageid"]] = page
            except:
                continue

        return result

    def get_featured_versions(
        self,
        event_wishes_qr: QueryResponse,
        featured: str,
    ) -> list[str]:
        result: list[str] = []

        page: Page
        for page in event_wishes_qr["query"]["pages"].values():
            if self.page_contain_featured(page, featured):
                append_unique(
                    result,
                    self.get_version_from_page(page)
                    + "."
                    + str(
                        self.get_minor_version(
                            event_wishes_qr,
                            self.get_version_from_page(page),
                            featured,
                            self.is_page_weapon(page),
                        )
                    ),
                )

        result.sort(key=StrictVersion)
        return result

    def get_next_banner_date(
        self,
        event_wishes_qr: QueryResponse,
        start_date: str,
        is_weapon: bool,
    ) -> str:
        result = sorted(
            [
                get_banner_date(p)
                for p in event_wishes_qr["query"]["pages"].values()
                if is_page_banner(p)
                and self.is_page_weapon(p) == is_weapon
                and get_banner_date(p) > start_date
            ]
        )

        if len(result) > 0:
            return result[0]
        return ""

    def get_featured_dates(
        self,
        event_wishes_qr: QueryResponse,
        featured: str,
    ) -> list[BannerDates]:
        result: list[BannerDates] = []

        page: Page
        for page in event_wishes_qr["query"]["pages"].values():
            if self.page_contain_featured(page, featured):
                append_unique(
                    result,
                    {
                        "start": get_valid_date_or_blank(get_banner_date(page)),
                        "end": get_valid_date_or_blank(
                            self.get_next_banner_date(
                                event_wishes_qr,
                                get_banner_date(page),
                                self.is_page_weapon(page),
                            )
                        ),
                    },
                )

        def get_banner_start_date(b: BannerDates) -> str:
            # empty start dates should go to the end
            if b["start"] == "":
                return "999999999"

            return b["start"]

        result.sort(key=get_banner_start_date)
        return result

    def get_featured_banner_history(
        self,
        event_wishes_qr: QueryResponse,
        featured_qs: QueryResponse,
    ) -> list[BannerHistory]:
        result: list[BannerHistory] = []
        page: Page
        for page in featured_qs["query"]["pages"].values():
            result.append(
                {
                    "name": page["title"],
                    "versions": self.get_featured_versions(
                        event_wishes_qr, page["title"]
                    ),
                    "dates": self.get_featured_dates(event_wishes_qr, page["title"]),
                }
            )
            assert len(result[-1]["versions"]) == len(result[-1]["dates"])

        return sorted(
            [r for r in result if len(r["versions"]) > 0],
            key=lambda f: f["versions"][0],
        )

    def transform_data(
        self,
        event_wishes_qr: QueryResponse,
        five_star_characters_qr: QueryResponse,
        four_star_characters_qr: QueryResponse,
        five_star_weapons_qr: QueryResponse,
        four_star_weapons_qr: QueryResponse,
    ) -> BannerDataset:
        return {
            "fiveStarCharacters": self.get_featured_banner_history(
                self.filter_invalid_pages(event_wishes_qr),
                five_star_characters_qr,
            ),
            "fourStarCharacters": self.get_featured_banner_history(
                self.filter_invalid_pages(event_wishes_qr),
                four_star_characters_qr,
            ),
            "fiveStarWeapons": self.get_featured_banner_history(
                self.filter_invalid_pages(event_wishes_qr),
                five_star_weapons_qr,
            ),
            "fourStarWeapons": self.get_featured_banner_history(
                self.filter_invalid_pages(event_wishes_qr),
                four_star_weapons_qr,
            ),
        }
