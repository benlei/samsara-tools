import argparse
import json
import pathlib
from urllib import request

import samsara.generate
from samsara import fandom, characters


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        usage="%(prog)s [OPTION]",
        description="Pulls the character data from Fandom page and outputs images and JSON data to specific "
        "locations. By default, it will pull only missing images.",
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
        default=500,
        help="Minimum data size to expect (500 bytes by default), and if it falls below that then do nothing.",
    )

    return parser


def main() -> None:
    args: argparse.Namespace = get_parser().parse_args()

    data = characters.load_characters(
        characters.trim_doc(fandom.get_raw_character_list())
    )

    write_images(args, data)

    write_json_data(args, data)


def write_images(args: argparse.Namespace, data: dict):
    image_path = pathlib.Path(args.output_image_dir)
    for character_name, img_url in data.items():
        path = image_path.joinpath(
            "characters",
            f"{samsara.generate.filename(character_name)}.png",
        )
        if args.force or not path.exists():
            request.urlretrieve(
                img_url,
                path,
            )
            print(f"Saved {path}")


def write_json_data(args: argparse.Namespace, data: dict):
    minified = json.dumps(characters.minify(data))
    if len(minified) < args.min_data_size:
        raise f"Character data was under {args.min_data_size} (was {len(minified)}) -- aborting!"

    with open(args.output_json, "w") as f:
        f.write(minified)


if __name__ == "__main__":
    main()
