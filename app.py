from random import random
from flask import Flask, redirect, render_template, request
from flask_socketio import SocketIO, close_room, emit, join_room, rooms, leave_room

import json
import game
import os

app = Flask(__name__)

if os.environ.get("FLASK_RUN_FROM_CLI") == "true":
    socketio = SocketIO(app)  # default async_mode for flask run
else:
    socketio = SocketIO(app, async_mode="eventlet")  # use eventlet for gunicorn

    # maybe use sessions - which requires a secret key

# TODO: make an error handler for some of the big errors - 503, 404

# TODO: figure out win conditions
# TODO: fix lobby creation
# TODO: close lobbies on disconnects

# TODO: make the site a lot prettier

#==============================
# Globals + Set-Up
#==============================
NUM_LOBBIES = 9

lobbiesData = {}

def createLobbies():
    # Create the storage for each
    for i in range(NUM_LOBBIES):
        lobbiesData[i+1] = {}
        createLobby(i+1)

def createLobby(lobbyName):
    # make sure that each room is initialized to have 0 connected users
    lobbiesData[lobbyName]["usersConnected"] = 0
    lobbiesData[lobbyName]["user1RoomCode"] = "not set"
    lobbiesData[lobbyName]["user2RoomCode"] = "not set"
    lobbiesData[lobbyName]["playersReady"] = 0

createLobbies()


#==============================
# Basic Routing
#==============================

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html")

# serve our index.html page when you go to the root page
@app.get("/")
def index():
    return render_template("index.html", numLobbies = NUM_LOBBIES)

@app.get("/rules")
def rules():
    return render_template("rules.html")

# serve our lobby.html page when you go to any other page. uses the passed lobby (second part of URL) as part of the template
@app.get("/lobby/<lobby>")
def lobby(lobby: str):
    try:
        lobby_int = int(lobby)

        if lobby_int <= 0 or lobby_int > NUM_LOBBIES:
            raise ValueError

        return render_template("lobby.html", lobbyName=lobby_int)
    except ValueError:
        return redirect("/")


# ===============================
#       INDEX FUNCTIONS
# ================================

# socket for checking if a room is full
@socketio.on('exists')
def handleExists(lobbyNumber):
    if(lobbiesData[lobbyNumber]["usersConnected"] < 2):
        emit('exists', (lobbyNumber, 1)) # send a message back with true in the exists slot
    else:
        emit('exists', (lobbyNumber, 0)) # send a message back with false in the exists slot


# socket for managing response to clients connecting to the socket
@socketio.on('connect')
def handleConnect(auth):
    print('connected')


# socket for managing response to clients leaving the socket. Returns false if it didn't close a lobby
@socketio.on('disconnect')
def handleDisconnect():
    print("received a disconnect")
    roomDetails = rooms()       # check what rooms the socket that sent the message is in
    # we have to do this for loop stuff bc every socket is also part of its own room,
        # and as far as i can tell, the order of this list isn't confirmed to stay the same all the time
        # so we can't just leave the first room in its list - we have to make sure its actually the key for our lobby

    if len(roomDetails) == 1:
        print("disconnected from index")
        return False

    for roomName in roomDetails:
        print("checking a room name for name:", roomName)
        if roomName in lobbiesData.keys():  # for each room it's in (that isn't its personal room) remove it from that room and update the server's count
            print("started to close a room: ", roomName)
            # kick out both players
            emit("closeRoom", to=roomName, broadcast=True)

            # there may or may not be something super broken with to=room and broadcast, which forces us to do users. i am going to ignore that right now
            # if it remains broken, this is some fuckery that gets around it

            # getCode returns false if the room doesn't exist, so we just check that they both exist
            # u1code = game.getRoomCode(roomName, 1)
            # u2code = game.getRoomCode(roomName, 2)
            # if u1code or u2code:
            #     emit("closeRoom", to=u1code)
            #     emit("closeRoom", to=u2code)

            # reset the attributes for the lobby
            createLobby(roomName)

            # close the room
            close_room(roomName)

            # delete game from GAMES
            game.deleteGame(roomName)
    return True



# ============================
#   LOBBY FUNCTIONS
# ============================

# manage connections to a specific lobby
@socketio.on('join')
def handleJoin(lobby):
    print("responding to a join message from lobby", lobby)
    # do another check to see if the lobby is full already
    if lobbiesData[lobby]["usersConnected"] <  2:
        clientRoomCode = rooms()[0]

        join_room(lobby)    # put the socket into the socketio lobby
        lobbiesData[lobby]["usersConnected"] += 1

        # The number of users connected also serves as the client's ID
        id = lobbiesData[lobby]["usersConnected"]

        # save our room code to lobby's details
        if id == 1:
            lobbiesData[lobby]["user1RoomCode"] = clientRoomCode
        elif id == 2:
            lobbiesData[lobby]["user2RoomCode"] = clientRoomCode
        else:
            raise Exception("Join received an ID that wasn't 1 or 2")

        # send a join success back to the request
        emit('join', (1, id))

        print("after this join request, we have this many usersConnected:", lobbiesData[lobby]["usersConnected"])
        # if we're now full, send a fullLobby message to both clients in the lobby
        if lobbiesData[lobby]["usersConnected"] == 2:
            createGame(lobby)
    else:
        # emit a failed join request with no ID and no lobby.
        emit('join', (0, 0))


# =============================
#       GAME FUNCTIONS
#   - the heavy lifting for all of these is in game.py
#   - this is so that we're not passing copies of socketio
#   - and so we can maintain only one listener per event
#   - we MAY be able to just place these in game.py, but we'd need to find a way to comfortably pass socketio to that file
# =============================

def createGame(lobbyName):
    """
    Initialize a game in a lobby. This is the moment where stats recognize a game as "starting"
    """
    emit('fullLobby', to=lobbyName, broadcast=True)

    # when we start our game, we pass it the name of the lobby,
    # we also pass the room codes for both players, so that it can send messages to them specifically even when its not a callback
    game.create_game(lobbyName, lobbiesData[lobbyName]["user1RoomCode"], lobbiesData[lobbyName]["user2RoomCode"])
"""
Responds to each player submitting their map. Sets up the game's internal representation of their map
"""
@socketio.on('send_initial_maps')
def handleInitialMaps(lobbyName, id, ship_map):
    # call game.py's copy of this command
    success = game.handleInitialMaps(lobbyName, id, ship_map)

    # if that succeeded, run the code that responds to that
    if success:
        # send a copy of this player's hit_map to both players
        # map = json.dumps(game.getHitMap(lobbyName, id))
        # emit('rerender', map, to=lobbyName)
        print("handled an initial map")
    else:
        print("game.py failed to handle initial maps")
    # TODO: Tell someone that it's their move

"""
Responds to guesses. It updates the internal logic using game.handleGuess, and then sends a response "rerender" message to both players to update their
ship/hit maps.
"""
@socketio.on("guess")
def handleGuess(lobbyName, id, coords):

    game.handleGuess(lobbyName, id, coords)

    game.checkForDestroyedShips(lobbyName)

    # grab the room ID's for both players, so we can send them a message alone
    user1Code = game.getRoomCode(lobbyName, 1)
    user2Code = game.getRoomCode(lobbyName, 2)

    # this naming is confusing.
        # the first rerender is rendering your hitMap to your opponentMap element
        # the second rerender is rendering your opponent's hitMap to your selfMap, which is why it's called "ship"
        # which is why we can pass the same map to both of them

    if id == 1:
        map = json.dumps(game.getHitMap(lobbyName, 1))
        emit("rerender", ("hit", map), to=user1Code)
        emit("rerender", ("ship", map), to=user2Code)
        # switch turns to user 2
        emit("turnUpdate", 2, to=game.GAMES[lobbyName]["player1"].getUserCode())
        emit("turnUpdate", 2, to=game.GAMES[lobbyName]["player2"].getUserCode())

    elif id == 2:
        map = json.dumps(game.getHitMap(lobbyName, 2))
        emit("rerender", ("hit", map), to=user2Code)
        emit("rerender", ("ship", map), to=user1Code)
        # switch turns to user 1
        emit("turnUpdate", 1, to=game.GAMES[lobbyName]["player1"].getUserCode())
        emit("turnUpdate", 1, to=game.GAMES[lobbyName]["player2"].getUserCode())

    else:
        raise Exception("received an id that was neither 1 or 2")

    checkForVictory(lobbyName)


"""
Updates the number of ready users.
If all are ready, it sends a turnUpdate and starts the guessing
"""
@socketio.on("ready")
def player_ready(lobbyName):
    lobbiesData[lobbyName]["playersReady"] += 1

    if(lobbiesData[lobbyName]["playersReady"] > 1):
        # this does our initial turn order
        coinFlip = random()
        if coinFlip > 0.5:
            emit("turnUpdate", 1, to=game.GAMES[lobbyName]["player1"].getUserCode())
            emit("turnUpdate", 1, to=game.GAMES[lobbyName]["player2"].getUserCode())
        else:
            emit("turnUpdate", 2, to=game.GAMES[lobbyName]["player1"].getUserCode())
            emit("turnUpdate", 2, to=game.GAMES[lobbyName]["player2"].getUserCode())

        # TODO: This is a janky way of sending messages, maybe clean it up?
        emit("all_players_ready", to=game.GAMES[lobbyName]["player1"].getUserCode())
        emit("all_players_ready", to=game.GAMES[lobbyName]["player2"].getUserCode())

"""
Sends the winner's map to the loser.
"""
@socketio.on("send_lost_map")
def show_loser_map(lobbyName, playerID, map):
    if(playerID == 1):
        emit("sent_lost_map", (map, game.getHitMap(lobbyName, 2)), to=game.GAMES[lobbyName]["player2"].getUserCode())
    else:
        emit("sent_lost_map", (map, game.getHitMap(lobbyName, 1)), to=game.GAMES[lobbyName]["player1"].getUserCode())


def checkForVictory(lobbyName):
    """
    Asks game.py whether any player has won. If one has, emits messages to both players about the result.
    """
    victory = game.checkForVictory(lobbyName)
    if victory:
        # send a victory message with the winner's id as the content
        socketio.emit("victory", victory, to=game.GAMES[lobbyName]["player1"].getUserCode())
        socketio.emit("victory", victory, to=game.GAMES[lobbyName]["player2"].getUserCode())

# ===========================
#   Weird stuff to make this work in a way we never use
# ===========================

# run the server when you run this file
if (__name__ == '__main__'):
    socketio.run(app, port=8080)