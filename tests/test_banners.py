from samsara.banners import BannersParser
from tests.expected_banner_results import ExpectedTransformedData
from tests.mock_query_responses import (
    MockEventWishesQueryResponse,
    MockFiveStarCharacterQueryResponse,
    MockFourStarCharacterQueryResponse,
    MockFourStarWeaponQueryResponse,
    MockFiveStarWeaponQueryResponse,
)


def test_transform_data():
    assert ExpectedTransformedData == BannersParser().transform_data(
        MockEventWishesQueryResponse,
        MockFiveStarCharacterQueryResponse,
        MockFourStarCharacterQueryResponse,
        MockFiveStarWeaponQueryResponse,
        MockFourStarWeaponQueryResponse,
    )
