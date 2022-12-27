import json
import pathlib

from samsara import characters


def test_characters():
    with open(pathlib.Path(__file__).parent.joinpath("character_list.html"), "r") as f:
        doc = f.read()

    doc = characters.trim_doc(doc)

    # with open(pathlib.Path(__file__).parent.joinpath("expected_character_data.json"), "w") as f:
    #     json.dump(characters.load_characters(doc), f)

    with open(
            pathlib.Path(__file__).parent.joinpath("expected_character_data.json"), "r"
    ) as f:
        assert json.load(f) == characters.load_characters(doc)
