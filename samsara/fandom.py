import logging
import shutil
from pathlib import Path
from typing import TypedDict, NotRequired

import requests as requests
from mergedeep import merge, Strategy

# seems like 1-2 pages a year, so this should be more than enough
MaxContinues = 100

Continuable = TypedDict(
    "Continuable",
    {
        "continue": NotRequired[str],
        "clcontinue": NotRequired[str],
        "gcmcontinue": NotRequired[str],
    },
)


class Category(TypedDict):
    title: str


class Page(TypedDict):
    pageid: int
    title: str
    categories: list[Category]


Pages = dict[str, Page]


class Query(TypedDict):
    pages: NotRequired[Pages]


QueryResponse = TypedDict(
    "QueryResponse",
    {
        "continue": NotRequired[Continuable],
        "query": NotRequired[Query],
        "errors": NotRequired[any],
        "warnings": NotRequired[any],
        "total_pages": NotRequired[int],
    },
)


def query_all(
    params: dict[str, str], api_url="https://genshin-impact.fandom.com/api.php"
) -> QueryResponse:
    result: QueryResponse = QueryResponse()
    start = 0

    while start < MaxContinues:
        response: QueryResponse = requests.get(
            api_url,
            params=params,
        ).json()

        if "error" in response:
            raise Exception(response["error"])
        if "warnings" in response:
            print(response["warnings"])

        merge(result, response, strategy=Strategy.ADDITIVE)

        start += 1

        if "continue" in response:
            params["clcontinue"] = response["continue"]["clcontinue"]
            params["continue"] = response["continue"]["continue"]
            # break out of the loop when we reach the end of pagination
            continue
        break

    result["total_pages"] = start
    return result


def get_event_wishes() -> QueryResponse:
    logging.info("gathering all event wishes")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:Event_Wishes",
            "prop": "categories",
            "cllimit": "max",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def get_5_star_characters() -> QueryResponse:
    logging.info("gathering all 5 star characters")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:5-Star_Characters",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def get_4_star_characters() -> QueryResponse:
    logging.info("gathering all 4 star characters")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:4-Star_Characters",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def get_5_star_weapons() -> QueryResponse:
    logging.info("gathering all 5 star weapons")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:5-Star_Weapons",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def get_4_star_weapons() -> QueryResponse:
    logging.info("gathering all 4 star weapons")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:4-Star_Weapons",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def download_character_image(output_path: str | Path, character_name: str, size: int):
    logging.info(f"downloading {character_name} icon to {output_path}")
    r = requests.get(
        f"https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/{character_name} Icon.png&width={size}&height={size}",
        stream=True,
    )

    if r.status_code != 200:
        logging.warning(
            f"Received status {r.status_code} trying to download weapon image {character_name}"
        )
    else:
        with open(output_path, "wb") as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)


def download_weapon_image(output_path: str | Path, weapon_name: str, size: int):
    logging.info(f"downloading {weapon_name} icon to {output_path}")

    r = requests.get(
        f"https://genshin-impact.fandom.com/index.php?title=Special:Redirect/file/Weapon {weapon_name}.png&width={size}&height={size}",
        stream=True,
    )

    if r.status_code != 200:
        logging.warning(
            f"Received status {r.status_code} trying to download weapon image {weapon_name}"
        )
    else:
        with open(output_path, "wb") as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)

def get_page_content(page_id: int) -> QueryResponse:
    logging.info(f"fetching page content for {page_id}")
    return query_all(
        {
            "action": "query",
            "pageids": str(page_id),
            "prop": "revisions",
            "rvprop": "content",
            "rvslots": "main",
            "format": "json",
            "formatversion": "2",
        })
