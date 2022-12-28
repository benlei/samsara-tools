from samsara import htmldoc


def test_remove_tags():
    assert htmldoc.remove_tags("<tr><td>yo<b>something</b></td>") == "yosomething"
