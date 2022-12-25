import argparse
import json
import pathlib
from urllib import request

from samsara import fandom, banners


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        usage="%(prog)s [OPTION]",
        description="Pulls the banner data from Fandom page and outputs images and JSON data to specific locations. By default, it will pull only missing images.",
    )

    parser.add_argument(
        "--output-json",
        action="store",
        required=True,
        help="The location to output the JSON data to",
    )

    parser.add_argument(
        "--output-image-dir",
        action="store",
        required=True,
        help="The directory to output the image to",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Force replaces all images with newer ones",
    )

    parser.add_argument(
        "--min-data-size",
        action="store",
        type=int,
        default=5000,
        help="Minimum data size to expect (15k bytes by default), and if it falls below that then do nothing.",
    )

    return parser


def main() -> None:
    args: argparse.Namespace = get_parser().parse_args()

    data = banners.load_banners(banners.trim_doc(fandom.get_raw_wish_history()))

    write_images(args, data)

    write_json_data(args, data)


def write_images(args, data):
    image_path = pathlib.Path(args.output_image_dir)
    for stars in data["weapons"].values():
        for weaponName, weapon in stars.items():
            if (
                args.force
                or not image_path.joinpath(
                    f"Weapon-{banners.filename(weaponName)}.png"
                ).exists()
            ):
                request.urlretrieve(
                    weapon["image"],
                    image_path.joinpath(f"Weapon-{banners.filename(weaponName)}.png"),
                )

    for stars in data["characters"].values():
        for characterName, character in stars.items():
            if (
                args.force
                or not image_path.joinpath(
                    f"Character-{banners.filename(characterName)}.png"
                ).exists()
            ):
                request.urlretrieve(
                    character["image"],
                    image_path.joinpath(
                        f"Character-{banners.filename(characterName)}.png"
                    ),
                )


def write_json_data(args, data):
    minified = json.dumps(banners.minify(data))
    if len(minified) < args.min_data_size:
        raise f"Banner data was under {args.min_data_size} (was {len(minified)} -- aborting!"

    with open(args.output_json, "w") as f:
        f.write(minified)


if __name__ == "__main__":
    main()
