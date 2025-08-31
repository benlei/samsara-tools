# Luna Version Sorting Implementation

## Summary

This update adds support for handling "Luna I", "Luna II", etc. versions in the version sorting functionality, treating them as sequential versions after 5.8.

## Changes Made

### 1. Updated `samsara/banners.py`

#### Import Changes
- Replaced `from distutils.version import StrictVersion` with `from packaging.version import Version`
- This change was necessary because `distutils` is deprecated in Python 3.12+

#### New Function: `parse_version_with_luna()`
- Added a custom version parsing function that handles both regular versions and Luna versions
- Luna versions are mapped as follows:
  - Luna I → 5.9
  - Luna II → 5.10  
  - Luna III → 5.11
  - Luna IV → 5.12
  - Luna V → 5.13
  - Luna VI → 5.14
  - Luna VII → 5.15
  - Luna VIII → 5.16
- Regular versions are handled normally using `packaging.version.Version`
- Malformed versions default to `(999, 999, 999)` for sorting to the end

#### Updated Methods
- `get_featured_versions()`: Changed sorting from `key=StrictVersion` to `key=parse_version_with_luna`
- `get_featured_banner_history()`: Updated sorting key to use `parse_version_with_luna`

### 2. Updated `tests/test_banners.py`

#### New Test Function: `test_parse_version_with_luna()`
- Comprehensive tests for regular version parsing
- Tests for all Luna versions (I through VIII)
- Tests for sorting behavior and edge cases
- Tests for malformed version handling

### 3. Added Demonstration Script

#### `demo_luna_versions.py`
- Interactive demonstration showing how Luna versions are sorted
- Shows equivalent mappings and example usage
- Useful for understanding the functionality

## Usage Example

```python
from samsara.banners import parse_version_with_luna

# Before: Using StrictVersion (deprecated)
# result.sort(key=StrictVersion)

# After: Using parse_version_with_luna
result.sort(key=parse_version_with_luna)

# Example sorting
versions = ['1.1', '5.8', 'Luna I', 'Luna II', '1.2', '5.7', 'Luna VIII']
sorted_versions = sorted(versions, key=parse_version_with_luna)
# Result: ['1.1', '1.2', '5.7', '5.8', 'Luna I', 'Luna II', 'Luna VIII']
```

## Benefits

1. **Future-Proof**: Uses `packaging.version` instead of deprecated `distutils.version`
2. **Extensible**: Can easily handle additional Luna versions if needed
3. **Backward Compatible**: Regular versions continue to work exactly as before
4. **Well-Tested**: Comprehensive test coverage for all scenarios
5. **Maintainable**: Clean, documented code with clear separation of concerns

## Test Results

All tests pass:
- ✅ `test_transform_data` - Existing functionality maintained
- ✅ `test_parse_version_with_luna` - New Luna version functionality
- ✅ `test_filenameify` - Existing fandom functionality maintained  
- ✅ `test_query_all` - Existing fandom functionality maintained
