import argparse
import json
import pathlib
from urllib import request

import samsara.generate
from samsara import artifact_domains, artifacts, fandom


def get_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        usage="%(prog)s [OPTION]",
        description="Pulls the artifact data from Fandom page and outputs images and JSON data to specific "
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

    artifact_domain_data = artifact_domains.load_artifact_domains(
        artifact_domains.trim_doc(fandom.get_raw_artifact_domains())
    )
    artifact_data = artifacts.load_5star_artifacts(
        artifacts.trim_doc(fandom.get_raw_artifacts_sets())
    )

    write_images(args, artifact_data)
    write_json_data(
        args,
        artifact_domain_data=artifact_domain_data,
        artifact_data=artifact_data,
    )


def write_images(args: argparse.Namespace, data):
    image_path = pathlib.Path(args.output_image_dir)
    for artifact_name, artifact in data.items():
        path = image_path.joinpath(
            "artifacts",
            f"{samsara.generate.filename(artifact_name)}.png",
        )
        if args.force or not path.exists():
            request.urlretrieve(
                artifact["image"],
                path,
            )
            print(f"Saved {path}")


def write_json_data(args: argparse.Namespace, artifact_domain_data, artifact_data):
    minified = json.dumps(
        dict(
            artifacts=artifacts.minify(artifact_data),
            domains=artifact_domains.minify(artifact_domain_data, artifact_data),
        )
    )

    if len(minified) < args.min_data_size:
        raise f"Artifact data was under {args.min_data_size} (was {len(minified)} -- aborting!"

    with open(args.output_json, "w") as f:
        f.write(minified)


if __name__ == "__main__":
    main()
