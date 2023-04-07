import requests_mock

import samsara.generate
from samsara.fandom import query_all
from tests.expected_fandom_result import MergedQueryAllResult
from tests.mock_fandom_responses import FirstQueryAllPage, SecondQueryAllPage


def test_filenameify():
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato-------Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato  Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Aya'to")
    assert "Kamisato01236Ayato" == samsara.generate.filename("Kamisato01236Aya'to")


def test_query_all():
    with requests_mock.Mocker() as m:
        m.get(
            "https://genshin-impact.fandom.com/api.php?action=query&generator=categorymembers&gcmtitle=Category%3AEvent_Wishes&prop=categories&cllimit=max&gcmlimit=max&format=json",
            json=FirstQueryAllPage,
        )
        m.get(
            "https://genshin-impact.fandom.com/api.php?action=query&generator=categorymembers&gcmtitle=Category%3AEvent_Wishes&prop=categories&cllimit=max&gcmlimit=max&format=json&continue=||&clcontinue=209266|Event_Wishes",
            json=SecondQueryAllPage,
        )
        assert MergedQueryAllResult == query_all(
            {
                "action": "query",
                "generator": "categorymembers",
                "gcmtitle": "Category:Event_Wishes",
                "prop": "categories",
                "cllimit": "max",
                "gcmlimit": "max",
                "format": "json",
            }
        )
