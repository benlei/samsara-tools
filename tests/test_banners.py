import json
import pathlib

from samsara import banners


def test_load_banners():
    with open(pathlib.Path(__file__).parent.joinpath("wish_history.html"), "r") as f:
        doc = f.read()

    doc = banners.trim_doc(doc)

    # with open(pathlib.Path(__file__).parent.joinpath("expected_banner_data.json"), "w") as f:
    #     json.dump(banners.load_banners(doc),f)

    with open(
        pathlib.Path(__file__).parent.joinpath("expected_banner_data.json"), "r"
    ) as f:
        assert json.load(f) == banners.load_banners(doc)


def test_minify():
    with open(pathlib.Path(__file__).parent.joinpath("wish_history.html"), "r") as f:
        doc = f.read()

    doc = banners.trim_doc(doc)

    # with open(pathlib.Path(__file__).parent.joinpath("expected_minify_banner_data.json"), "w") as f:
    #     json.dump(banners.minify(banners.load_banners(doc)), f)

    with open(
        pathlib.Path(__file__).parent.joinpath("expected_minify_banner_data.json"), "r"
    ) as f:
        assert json.load(f) == banners.minify(banners.load_banners(doc))
