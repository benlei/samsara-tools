import copy
import re
from datetime import datetime
from packaging.version import Version
from typing import TypedDict, TypeVar
import logging

from samsara import fandom
from samsara.fandom import QueryResponse, Page

T = TypeVar("T")

logger = logging.getLogger(__name__)


def parse_version_with_luna(version: str) -> tuple:
    """
    Parse version string, handling Luna versions as sequential versions after 5.8.
    
    Luna I -> 5.9, Luna II -> 5.10, Luna III -> 5.11, etc.
    Regular versions like "1.2.3" are handled normally.
    
    Returns a tuple that can be used for sorting.
    """
    # Handle Luna versions
    luna_match = re.match(r'^Luna ([IVX]+)$', version)
    if luna_match:
        roman_numeral = luna_match.group(1)
        # Convert Roman numerals to numbers
        roman_to_int = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
            'VI': 6, 'VII': 7, 'VIII': 8
        }
        luna_number = roman_to_int.get(roman_numeral, 1)
        # Treat Luna I as 5.9, Luna II as 5.10, etc.
        synthetic_version = f"5.{8 + luna_number}"
        return tuple(int(x) for x in synthetic_version.split('.')) + (0,)
    
    # Handle regular versions
    try:
        v = Version(version)
        # Convert to tuple compatible with old StrictVersion format
        parts = list(v.release)
        while len(parts) < 3:
            parts.append(0)
        return tuple(parts[:3])
    except Exception:
        # Fallback for any malformed versions
        return (999, 999, 999)


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
    except BaseException:
        return ""


def is_page_banner(page: Page) -> bool:
    return page["title"].find("/") != -1


def get_banner_date(p: Page) -> str:
    return p["title"].split("/")[1]


def append_unique(l: list[T], value: T):
    if value not in l:
        l.append(value)


pagecache = {}


class BannersParser:
    def __init__(self) -> None:
        self.CategoryVersionPrefix = "Category:Released in Version "
        self.CategoryFeaturedPrefix = "Category:Features "
        self.WeaponPagePrefix = r"Epitome Invocation"
        self.ChangeHistoryRegex = re.compile(r"\{\{Change History\|(\d+\.\d+)\}\}")

    def cached_fetch_page_content(self, page_id: int) -> str:
        if page_id in pagecache:
            return pagecache[page_id]

        try:
            pagecache[page_id] = self.fetch_page_content(page_id)
        except BaseException:
            pagecache[page_id] = ""

        return pagecache[page_id]

    def fetch_page_content(self, page_id: int) -> str:
        return fandom.get_page_content(page_id)["query"]["pages"][0]["revisions"][0][
            "slots"
        ]["main"]["content"]

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

        if len(versions) != 1 and is_last_breadcrumb_a_version():
            return get_last_breadcrump()

        if len(versions) == 0:
            content = self.cached_fetch_page_content(p["pageid"])
            match = self.ChangeHistoryRegex.search(content)
            matched_version = match.group(1) if match else None
            if matched_version:
                return matched_version

            raise Exception(f"Could not determine version from page {p['title']}")

        return versions[0]["title"][len(self.CategoryVersionPrefix) :]

    def is_page_weapon(self, page: Page) -> bool:
        return not not re.match(self.WeaponPagePrefix, page["title"])
        # return page["title"].startswith(self.WeaponPagePrefix)

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
        def key_by_valid_date(p: Page) -> str:
            return (
                get_valid_date_or_blank(get_banner_date(p))
                if get_valid_date_or_blank(get_banner_date(p)) != ""
                else "9999-99-99"
            )

        return sorted(
            [
                p
                for p in event_wishes_qr["query"]["pages"].values()
                if is_page_banner(p)
                and self.is_page_weapon(p) == is_weapon
                and self.get_version_from_page(p) == version
            ],
            key=key_by_valid_date,
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
            except BaseException as e:
                # Log or print the error message
                logger.info(f"An error occurred: {e}")
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

        result.sort(key=parse_version_with_luna)
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
                        )
                        if get_valid_date_or_blank(get_banner_date(page)) != ""
                        else "",
                    },
                )

        def get_banner_start_date(b: BannerDates) -> str:
            # empty start dates should go to the end
            if b["start"] == "":
                return "999999999"

            return b["start"]

        result.sort(key=get_banner_start_date)
        return result

    def convert_specialization_page_to_title(self, p: Page) -> str:
        if '/' in p['title']:
            return p["title"].split("/")[0] + " (" + p["title"].split("/")[1] + ")"
        else:
            return p["title"]
    
    def get_featured_banner_history(
        self,
        event_wishes_qr: QueryResponse,
        featured_qs: QueryResponse,
    ) -> list[BannerHistory]:
        result: list[BannerHistory] = []
        page: Page
        for page in featured_qs["query"]["pages"].values():
            page['title'] = self.convert_specialization_page_to_title(page)
            
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
            key=lambda f: parse_version_with_luna(f["versions"][0]),
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


def get_qr_page_titles(qr: QueryResponse, category: str) -> list[str]:
    result = []
    for page in qr["query"]["pages"].values():
        result.append(page["title"])

    return result


def strip_chronicled_prefix(title: str) -> str:
    return title[len("Category:Wish Pool Includes ") :]


def coerce_chronicled_to_char_banner(
    chronicled_qr: QueryResponse, char_qr: QueryResponse
):
    five_star_characters = get_qr_page_titles(char_qr, "Category:5-Star Characters")
    result: QueryResponse = {"query": {"pages": {}}}

    for page in chronicled_qr["query"]["pages"].values():
        if not is_page_banner(page):
            continue

        result["query"]["pages"][page["pageid"]] = copy.deepcopy(page)
        result["query"]["pages"][page["pageid"]]["categories"].extend(
            [
                {"title": "Category:Features " + strip_chronicled_prefix(c["title"])}
                for c in page["categories"]
                if strip_chronicled_prefix(c["title"]) in five_star_characters
            ]
        )

    # logger.info(result)
    return result


def coerce_chronicled_to_weap_banner(
    chronicled_qr: QueryResponse, char_qr: QueryResponse
):
    five_star_weapons = get_qr_page_titles(char_qr, "Category:5-Star Weapons")
    result: QueryResponse = {"query": {"pages": {}}}

    for page in chronicled_qr["query"]["pages"].values():
        if not is_page_banner(page):
            continue

        # weap banner can be differentiated by negative page id...
        result["query"]["pages"][-page["pageid"]] = copy.deepcopy(page)
        result["query"]["pages"][-page["pageid"]]["pageid"] = -page["pageid"]
        result["query"]["pages"][-page["pageid"]]["title"] = (
            "Epitome Invocation/" + page["title"].split("/")[1]
        )
        result["query"]["pages"][-page["pageid"]]["categories"].extend(
            [
                {"title": "Category:Features " + strip_chronicled_prefix(c["title"])}
                for c in page["categories"]
                if strip_chronicled_prefix(c["title"]) in five_star_weapons
            ]
        )

    return result
