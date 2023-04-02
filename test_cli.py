import json

from samsara import banners, fandom


def main() -> None:
    # fandom.MaxContinues = 5

    with open("mystuff.json", "w") as f:
        f.write(json.dumps(fandom.get_event_wishes(), indent=2))


if __name__ == "__main__":
    main()
