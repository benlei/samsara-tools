import logging
import shutil
from pathlib import Path

import requests as requests

from samsara.fandom import QueryResponse, query_all


def get_event_wishes() -> QueryResponse:
    logging.info("gathering all event wishes")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:Event_Warps",
            "prop": "categories",
            "cllimit": "max",
            "gcmlimit": "max",
            "format": "json",
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
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
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
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
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
    )


def get_5_star_weapons() -> QueryResponse:
    logging.info("gathering all 5 star weapons")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:5-Star_Light_Cones",
            "gcmlimit": "max",
            "format": "json",
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
    )


def get_4_star_weapons() -> QueryResponse:
    logging.info("gathering all 4 star weapons")
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:4-Star_Light_Cones",
            "gcmlimit": "max",
            "format": "json",
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
    )


def download_character_image(output_path: str | Path, character_name: str, size: int):
    logging.info(f"downloading {character_name} icon to {output_path}")
    # https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Character%20Hook%20Icon.png
    r = requests.get(
        f"https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Character {character_name} Icon.png&width={size}&height={size}",
        stream=True,
    )

    if r.status_code != 200:
        logging.warning(
            f"Received status {r.status_code} trying to download character image {character_name}"
        )
    else:
        with open(output_path, "wb") as f:
            r.raw.decode_content = True
            shutil.copyfileobj(r.raw, f)


def download_weapon_image(output_path: str | Path, weapon_name: str, size: int):
    logging.info(f"downloading {weapon_name} icon to {output_path}")

    r = requests.get(
        f"https://honkai-star-rail.fandom.com/index.php?title=Special:Redirect/file/Light Cone {weapon_name}.png&width={size}&height={size}",
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
            "prop": "revisions",
            "pageids": str(page_id),
            "rvprop": "content",
            "rvslots": "main",
            "format": "json",
            "formatversion": "2",
        },
        api_url="https://honkai-star-rail.fandom.com/api.php",
    )
