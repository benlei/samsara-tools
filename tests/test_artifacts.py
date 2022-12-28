import json
import pathlib

from samsara import artifacts


def test_load_artifacts():
    with open(
        pathlib.Path(__file__).parent.joinpath("resources/artifact_sets.html"), "r"
    ) as f:
        doc = f.read()

    doc = artifacts.trim_doc(doc)

    artifacts.load_5star_artifacts(doc)

    # with open(
    #     pathlib.Path(__file__).parent.joinpath(
    #         "resources/expected_artifacts_data.json"
    #     ),
    #     "w",
    # ) as f:
    #     json.dump(artifacts.load_5star_artifacts(doc), f)

    with open(
        pathlib.Path(__file__).parent.joinpath(
            "resources/expected_artifacts_data.json"
        ),
        "r",
    ) as f:
        assert json.load(f) == artifacts.load_5star_artifacts(doc)
