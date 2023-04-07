import samsara.generate
from samsara import fandom


def test_filenameify():
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato-------Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato  Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Aya'to")
    assert "Kamisato01236Ayato" == samsara.generate.filename("Kamisato01236Aya'to")
