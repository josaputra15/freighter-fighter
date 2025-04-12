from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, rooms, leave_room
import json
import game

app = Flask(__name__)
socketio = SocketIO(app) # wrap socketio installation into new name - maybe makes a connection to our app too?

# TODO: figure out how to manage people reconnecting
    # maybe use sessions - which requires a secret key

# TODO: make an error handler for some of the big errors - 503, 404


#==============================
# Globals + Set-Up
#==============================
# TODO: figure out if this ought to be in the name = main shit
lobbiesData = {}

def createLobbies():
    # Create the storage for each 
    for i in range(4):
        lobbiesData[i] = {}
        createLobby(i)

def createLobby(lobbyName):
    # make sure that each room is initialized to have 0 connected users
    lobbiesData[lobbyName]["usersConnected"] = 0
    lobbiesData[lobbyName]["user1RoomCode"] = "not set"
    lobbiesData[lobbyName]["user2RoomCode"] = "not set"

createLobbies()


#==============================
# Basic Routing
#==============================
# serve our index.html page when you go to the root page
@app.get("/")
def index():
    return render_template("index.html")


# serve our lobby.html page when you go to any other page. uses the passed lobby (second part of URL) as part of the template
@app.get("/<lobby>")
def lobby(lobby):
    return render_template("lobby.html", lobbyNum=lobby, userNum="example")


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


# socket for managing response to clients leaving the socket
@socketio.on('disconnect')
def handleDisconnect():
    roomDetails = rooms()       # check what rooms the socket that sent the message is in
    # we have to do this for loop stuff bc every socket is also part of its own room, 
        # and as far as i can tell, the order of this list isn't confirmed to stay the same all the time
        # so we can't just leave the first room in its list - we have to make sure its actually the key for our lobby
    for roomName in roomDetails:
        if roomName in lobbiesData.keys():  # for each room it's in (that isn't its personal room) remove it from that room and update the server's count
            lobbiesData[roomName]["usersConnected"] -= 1
            leave_room(roomName)
            print("disconnected from", roomName)

    # TODO: make this do stuff based on the disconnection. close the room, save the data, etc?
    if len(roomDetails) == 1:
        print("disconnected from index")


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
            emit('fullLobby', to=lobby, broadcast=True)

            # when we start our game, we pass it the name of the lobby, 
            # we also pass the room codes for both players, so that it can send messages to them specifically even when its not a callback
            game.create_game(lobby, lobbiesData[lobby]["user1RoomCode"], lobbiesData[lobby]["user2RoomCode"])
    else:
        emit('join', (0, 0))


# =============================
#       GAME FUNCTIONS
#   - the heavy lifting for all of these is in game.py
#   - this is so that we're not passing copies of socketio
#   - and so we can maintain only one listener per event
#   - we MAY be able to just place these in game.py, but we'd need to find a way to comfortably pass socketio to that file
# =============================

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
    success = game.handleGuess(lobbyName, id, coords)

    if success:
        # grab the room ID's for both players, so we can send them a message alone
        user1Code = game.getRoomCode(lobbyName, 1)
        user2Code = game.getRoomCode(lobbyName, 2)

        # TODO: this naming is confusing. we're sending the opponent's hit map to you, but you're drawing it to your shipMap
        if id == 1:
            map = json.dumps(game.getHitMap(lobbyName, 1))
            emit("rerender", ("hit", map), to=user1Code)
            emit("rerender", ("ship", map), to=user2Code)
            # TODO: implement a turn switch here too
        elif id == 2:
            map = json.dumps(game.getHitMap(lobbyName, 2))
            # TODO: this naming is confusing. we're sending the opponent's hit map to you, but you're drawing it to your shipMap
            emit("rerender", ("hit", map), to=user2Code)
            emit("rerender", ("ship", map), to=user1Code)
            # TODO: implement a turn switch here too
        else:
            raise Exception("received an id that was neither 1 or 2")
    else:
        print("game.py failed to handle guess")



# ===========================
#   Weird stuff to make this work in a way we never use
# ===========================

# run the server when you run this file
if (__name__ == '__main__'):
    socketio.run(app)