from unittest import mock
from samsara.banners import BannersParser, parse_version_with_luna
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


def test_parse_version_with_luna():
    """Test that Luna versions are handled correctly"""
    # Test regular versions
    assert parse_version_with_luna("1.2.3") == (1, 2, 3)
    assert parse_version_with_luna("5.8.0") == (5, 8, 0)
    assert parse_version_with_luna("5.8") == (5, 8, 0)
    
    # Test Luna versions
    assert parse_version_with_luna("Luna I") == (5, 9, 0)
    assert parse_version_with_luna("Luna II") == (5, 10, 0)
    assert parse_version_with_luna("Luna III") == (5, 11, 0)
    assert parse_version_with_luna("Luna IV") == (5, 12, 0)
    assert parse_version_with_luna("Luna V") == (5, 13, 0)
    assert parse_version_with_luna("Luna VI") == (5, 14, 0)
    assert parse_version_with_luna("Luna VII") == (5, 15, 0)
    assert parse_version_with_luna("Luna VIII") == (5, 16, 0)
    
    # Test sorting order - Luna versions should come after 5.8 but before 6.0
    versions = ["6.0", "1.1", "5.8", "Luna I", "Luna II", "1.2", "5.7", "Luna VIII"]
    sorted_versions = sorted(versions, key=parse_version_with_luna)
    expected = ["1.1", "1.2", "5.7", "5.8", "Luna I", "Luna II", "Luna VIII", "6.0"]
    assert sorted_versions == expected
    
    # Test that Luna I is equivalent to 5.9 in sorting
    assert parse_version_with_luna("Luna I") == parse_version_with_luna("5.9")
    
    # Test that Luna I comes after regular 5.8 but before regular 5.10
    luna_vs_regular = ["5.10", "Luna I", "5.8"]
    sorted_luna_regular = sorted(luna_vs_regular, key=parse_version_with_luna)
    expected_luna_regular = ["5.8", "Luna I", "5.10"]
    assert sorted_luna_regular == expected_luna_regular
    
    # Test malformed versions
    assert parse_version_with_luna("invalid") == (999, 999, 999)
    assert parse_version_with_luna("Luna X") == (5, 9, 0)  # Unknown roman numeral defaults to 1
