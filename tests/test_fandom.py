import samsara.generate
from samsara import fandom

IMAGE_URL = "https://static.wikia.nocookie.net/gensin-impact/images/f/f2/Character_Wanderer_Thumb.png/revision/latest/scale-to-width-down/74?cb=20221207034209"


def test_rescale_image_url():
    assert (
        fandom.rescale_image_url(
            IMAGE_URL,
            100,
        )
        == "https://static.wikia.nocookie.net/gensin-impact/images/f/f2/Character_Wanderer_Thumb.png/revision/latest/scale-to-width-down/100?cb=20221207034209"
    )


def test_filenameify():
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato-------Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato  Ayato")
    assert "Kamisato-Ayato" == samsara.generate.filename("Kamisato Aya'to")
    assert "Kamisato01236Ayato" == samsara.generate.filename("Kamisato01236Aya'to")
