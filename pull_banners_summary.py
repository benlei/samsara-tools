import argparse
import json

from samsara import fandom, banners


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        usage="%(prog)s [OPTION]",
        description="Pulls the banner data from Fandom page and outputs a summary JSON data",
    )

    parser.add_argument(
        "--output-json",
        action="store",
        required=True,
        help="The location to output the JSON data to",
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

    data = banners.load_banners(banners.trim_doc(fandom.get_raw_wish_history()))

    write_json_data(args, data)


def write_json_data(args: argparse.Namespace, data: dict):
    minified = json.dumps(banners.summary_minify(data))
    if len(minified) < args.min_data_size:
        raise f"Sumary banner data was under {args.min_data_size} (was {len(minified)} -- aborting!"

    with open(args.output_json, "w") as f:
        f.write(minified)


if __name__ == "__main__":
    main()
