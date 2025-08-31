import re


def filename(name: str) -> str:
    result = name.replace(" ", "-")
    result = re.sub(r"[^a-zA-Z0-9\-]", "", result)
    return re.sub(r"--+", "-", result)
