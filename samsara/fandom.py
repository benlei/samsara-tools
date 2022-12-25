import requests as requests


def get_raw_wish_history() -> str:
    return requests.get("https://genshin-impact.fandom.com/wiki/Wish/History").text
