from flask_socketio import SocketIOTestClient
import pytest
from freighter.app import socketio

def new_user(app):
    flask_test_client = app.test_client()
    socketio_test_client = socketio.test_client(
        app, flask_test_client=flask_test_client
    )
    return socketio_test_client

def assert_received(user, value):
    received = user.get_received()
    message = [msg for msg in received if msg['name'] == value['name']]
    assert received[0].items() >= value.items()


def test_join(app):
    user1: SocketIOTestClient = new_user(app)
    user2: SocketIOTestClient = new_user(app)
    user3: SocketIOTestClient = new_user(app)

    user1.emit('join', 1)
    user2.emit('join', 1)
    user3.emit('join', 1)

    assert_received(user1, {'name': 'join', 'args': [1, 1]})
    assert_received(user2, {'name': 'join', 'args': [1, 2]})
    assert_received(user3, {'name': 'join', 'args': [0, 0]})