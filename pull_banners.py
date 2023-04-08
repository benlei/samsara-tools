import argparse
import logging
import pathlib

import yaml

import samsara.fandom
import samsara.generate
from samsara import fandom, banners
from samsara.banners import BannerDataset, BannerHistory

# the default dumper formats it as:
# foo:
# - a
# - b
#
# this dumper does:
# foo:
#   - a
#   - b
class IndentedPropertyDumper(yaml.Dumper):
    def increase_indent(self, flow=False, *args, **kwargs):
        return super().increase_indent(flow=flow, indentless=False)


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        usage="%(prog)s [OPTION]",
        description="Pulls the banner data from Fandom page and outputs images and JSON data to specific locations. "
        "By default, it will pull only missing images.",
    )

    parser.add_argument(
        "--output",
        action="store",
        required=True,
        help="The location to output the data to",
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
        default=40000,
        help="Minimum data size to expect (40k bytes by default), and if it falls below that then do nothing.",
    )

    return parser


def main() -> None:
    logging.basicConfig(level=logging.INFO)

    args: argparse.Namespace = get_parser().parse_args()

    data = banners.transform_data(
        fandom.get_event_wishes(),
        fandom.get_5_star_characters(),
        fandom.get_4_star_characters(),
        fandom.get_5_star_weapons(),
        fandom.get_4_star_weapons(),
    )

    write_data(args, data)
    write_images(args, data)


def write_images(args: argparse.Namespace, data: BannerDataset):
    def get_generic_feature_type(feature_type: str) -> str:
        if feature_type.lower().find("character") != -1:
            return "characters"
        return "weapons"

    image_path = pathlib.Path(args.output_image_dir)
    featured_type: str
    banner_history_list: list[BannerHistory]
    for featured_type, banner_history_list in data.items():
        for bannerHistory in banner_history_list:
            path = image_path.joinpath(
                get_generic_feature_type(featured_type),
                f"{samsara.generate.filename(bannerHistory['name'])}.png",
            )

            if args.force or not path.exists():
                if get_generic_feature_type(featured_type) == "characters":
                    fandom.download_character_image(path, bannerHistory["name"], 80)
                else:
                    fandom.download_weapon_image(path, bannerHistory["name"], 80)


def write_data(args: argparse.Namespace, data: BannerDataset):
    dump = yaml.dump(
        data,
        default_flow_style=False,
        sort_keys=False,
        Dumper=IndentedPropertyDumper,
    )

    if len(dump) < args.min_data_size:
        raise f"Banner data was under {args.min_data_size} (was {len(dump)}) -- aborting!"

    with open(args.output, "w") as f:
        f.write(dump)


if __name__ == "__main__":
    main()
