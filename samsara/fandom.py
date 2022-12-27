import requests as requests


def get_raw_wish_history() -> str:
    return requests.get("https://genshin-impact.fandom.com/wiki/Wish/History").text


def rescale_image_url(scaled_url: str, new_size: int) -> str:
    question_index = scaled_url.rfind('?')
    slash_index = scaled_url.rfind('/')
    return f"{scaled_url[0:slash_index]}/{new_size}{scaled_url[question_index:]}"
