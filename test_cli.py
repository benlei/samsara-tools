import shutil

import requests
import yaml

from samsara import fandom
from samsara.fandom import download_weapon_image


def main() -> None:
    # fandom.MaxContinues = 5
    # with open("mystuff.yaml", "w") as f:
    #     f.write(
    #         yaml.dump(
    #             fandom.get_5_star_characters(),
    #             default_flow_style=False,
    #             sort_keys=False,
    #         )
    #     )
    # with open("mystuff.json", "w") as f:
    #     f.write(json.dumps(fandom.get_5_star_weapons(), indent=2))
    # download_weapon_image("./test.png", "Freedom Sworn", 100)
    pass


if __name__ == "__main__":
    main()
