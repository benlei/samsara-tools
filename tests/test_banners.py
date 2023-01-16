import json
import pathlib

from samsara import banners


def test_summary_minify():
    with open(
        pathlib.Path(__file__).parent.joinpath("resources/wish_history.html"), "r"
    ) as f:
        doc = f.read()

    doc = banners.trim_doc(doc)

    # with open(
    #     pathlib.Path(__file__).parent.joinpath(
    #         "resources/expected_summary_minify_banner_data.json"
    #     ),
    #     "w",
    # ) as f:
    #     json.dump(banners.minify(banners.load_banners(doc)), f)

    with open(
        pathlib.Path(__file__).parent.joinpath(
            "resources/expected_summary_minify_banner_data.json"
        ),
        "r",
    ) as f:
        assert json.load(f) == banners.minify(banners.load_banners(doc))
