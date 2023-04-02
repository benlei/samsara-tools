from typing import TypedDict

import requests as requests
from mergedeep import merge, Strategy

# seems like 1-2 pages a year, so this should be more than enough
MaxContinues = 100


class Continuable(TypedDict("ContinuableResponse", {"continue": str})):
    clcontinue: str
    gcmcontinue: str


class Category(TypedDict):
    title: str


class Page(TypedDict):
    pageid: int
    title: str
    categories: list[Category]


Pages = dict[str, Page]


class Query(TypedDict):
    pages: Pages


class QueryResponse(TypedDict("QueryResponse", {"continue": Continuable})):
    query: Query
    errors: any
    warnings: any
    total_pages: int


# ref: https://stackoverflow.com/questions/312443/how-do-i-split-a-list-into-equally-sized-chunks
def chunks(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


def query_all(params: dict[str, str]) -> QueryResponse:
    result: QueryResponse = QueryResponse()
    start = 0

    while start < MaxContinues:
        response: QueryResponse = requests.get(
            "https://genshin-impact.fandom.com/api.php",
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
    return query_all(
        {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": "Category:4-Star_Weapons",
            "gcmlimit": "max",
            "format": "json",
        }
    )


def get_raw_wish_history() -> str:
    return requests.get("https://genshin-impact.fandom.com/wiki/Wish/History").text


def get_raw_character_list() -> str:
    return requests.get("https://genshin-impact.fandom.com/wiki/Character/List").text


def get_raw_artifact_domains() -> str:
    return requests.get(
        "https://genshin-impact.fandom.com/wiki/Domain_of_Blessing"
    ).text


def get_raw_artifacts_sets() -> str:
    return requests.get("https://genshin-impact.fandom.com/wiki/Artifact/Sets").text


def rescale_image_url(scaled_url: str, new_size: int) -> str:
    question_index = scaled_url.rfind("?")
    slash_index = scaled_url.rfind("/")
    return f"{scaled_url[0:slash_index]}/{new_size}{scaled_url[question_index:]}"
