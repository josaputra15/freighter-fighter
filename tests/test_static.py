import pytest

def test_index(client):
    response = client.get('/')
    assert b'<div id="lobbies">' in response.data


def test_lobby_valid(client):
    response = client.get('/lobby/1')
    assert response.status_code == 200
    assert b'Lobby 1 - User' in response.data

def test_lobby_invalid(client):
    response = client.get('/lobby/999')
    # Should redirect to index if lobby is invalid
    assert response.status_code == 302
    assert response.headers['Location'].endswith('/')

def test_404(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404
    assert b'404' in response.data