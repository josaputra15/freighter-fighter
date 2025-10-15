import pytest

def test_index(client):
    response = client.get('/')
    assert b'<div id="lobbies">' in response.data
