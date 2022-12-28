import json
import pathlib

from samsara import artifact_domains


def test_load_artifact_domains():
    with open(
        pathlib.Path(__file__).parent.joinpath("resources/artifact_domains.html"), "r"
    ) as f:
        doc = f.read()

    doc = artifact_domains.trim_doc(doc)

    # with open(
    #     pathlib.Path(__file__).parent.joinpath(
    #         "resources/expected_artifact_domains_data.json"
    #     ),
    #     "w",
    # ) as f:
    #     json.dump(artifact_domains.load_artifact_domains(doc), f)

    with open(
        pathlib.Path(__file__).parent.joinpath(
            "resources/expected_artifact_domains_data.json"
        ),
        "r",
    ) as f:
        assert json.load(f) == artifact_domains.load_artifact_domains(doc)
