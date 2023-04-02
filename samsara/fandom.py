from typing import TypedDict
from mergedeep import merge, Strategy
import requests as requests

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


Pages = dict[int, Page]


class Query(TypedDict):
    pages: Pages


class QueryResponse(TypedDict("QueryResponse", {"continue": Continuable})):
    query: Query
    errors: any
    warnings: any


def get_event_wishes() -> QueryResponse:
    result: QueryResponse = QueryResponse()
    start = 0

    parameters = {
        "action": "query",
        "generator": "categorymembers",
        "gcmtitle": "Category:Event_Wishes",
        # "gcmtitle": "Category:Event_Wishes",
        "prop": "categories",
        "cllimit": "max",
        "gcmlimit": "max",
        "format": "json",
    }

    while start < MaxContinues:
        response: QueryResponse = requests.get(
            "https://genshin-impact.fandom.com/api.php",
            params=parameters,
        ).json()

        print(response)

        if "error" in response:
            raise Exception(response["error"])
        if "warnings" in response:
            print(response["warnings"])
        if "continue" not in response:
            # break out of the loop when we reach the end of pagination
            break

        merge(result, response, strategy=Strategy.ADDITIVE)
        parameters["clcontinue"] = response["continue"]["clcontinue"]
        parameters["continue"] = response["continue"]["continue"]

        start += 1
        continue

    print(f"Total pages fetched: {start}")
    return result


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
