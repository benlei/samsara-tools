from urllib.request import urlopen


def get_raw_wish_history() -> str:
    with urlopen("https://genshin-impact.fandom.com/wiki/Wish/History") as f:
        return f.read()

