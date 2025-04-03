from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, rooms, leave_room

app = Flask(__name__)
socketio = SocketIO(app) # wrap socketio installation into new name - maybe makes a connection to our app too?

# TODO: figure out how to manage people reconnecting
    # maybe use sessions - which requires a secret key

# TODO: make an error handler for some of the big errors - 503, 404

def fillLobbyDetails(lobbyName):
    lobbyProperties = ["user1shipMap", "user2shipMap", "user1hitMap", "user2hitMap", "whoseTurn","winConTracking", "usersConnected"]
    for property in lobbyProperties:
        lobbiesData[lobbyName][property] = "here's the example data for this property"

    # in the short-term, make sure that each room is initialized to have 0 connected users
    lobbiesData[lobbyName]["usersConnected"] = 0

    print(lobbiesData[lobbyName])

# Create the storage for each 
lobbiesData = {}
for i in range(4):
    lobbiesData[i] = {}
    fillLobbyDetails(i)



# serve our index.html page when you go to the root page
@app.get("/")
def index():
    return render_template("index.html")


# serve our lobby.html page when you go to any other page. uses the passed lobby (second part of URL) as part of the template
@app.get("/<lobby>")
def lobby(lobby):
    return render_template("lobby.html", lobbyNum=lobby, userNum="example")


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
    for roomName in roomDetails:
        if roomName in lobbiesData.keys():  # for each room it's in (that isn't its personal room) remove it from that room and update the server's count
            print("trying to disconnect from ", roomName)
            lobbiesData[roomName]["usersConnected"] -= 1  # lower our server-side memory
            leave_room(roomName)            # remove socket from room
            print("disconnected from", roomName)

    if len(roomDetails) == 1:
        print("disconnected from index")


# manage connections to a specific lobby
@socketio.on('join')
def handleJoin(lobby):
    print("responding to a join message from lobby", lobby)
    # do another check to see if the lobby is full already
    if lobbiesData[lobby]["usersConnected"] < 2:
        join_room(lobby)
        lobbiesData[lobby]["usersConnected"] += 1
        emit('join', 1, to=lobby)
    else:
        emit('join', 0)


# run the server when you run this file
if (__name__ == '__main__'):
    socketio.run(app)