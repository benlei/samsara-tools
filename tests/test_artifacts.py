import pathlib

from samsara import artifacts


def test_load_artifacts():
    with open(
        pathlib.Path(__file__).parent.joinpath("resources/artifact_domains.html"), "r"
    ) as f:
        doc = f.read()

    doc = artifacts.trim_doc(doc)

    print(artifacts.load_artifacts(doc))
