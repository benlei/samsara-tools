from unittest import mock
from samsara.banners import BannersParser
from tests.expected_banner_results import ExpectedTransformedData
from tests.mock_query_responses import (
    MockEventWishesQueryResponse,
    MockFiveStarCharacterQueryResponse,
    MockFourStarCharacterQueryResponse,
    MockFourStarWeaponQueryResponse,
    MockFiveStarWeaponQueryResponse,
)


@mock.patch("samsara.fandom.get_page_content", return_value={})
def test_transform_data(get_page_content_mock):
    assert ExpectedTransformedData == BannersParser().transform_data(
        MockEventWishesQueryResponse,
        MockFiveStarCharacterQueryResponse,
        MockFourStarCharacterQueryResponse,
        MockFiveStarWeaponQueryResponse,
        MockFourStarWeaponQueryResponse,
    )
