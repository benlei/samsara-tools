import requests as requests


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
