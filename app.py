from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
socketio = SocketIO(app) # wrap socketio installation into new name - maybe makes a connection to our app too?

# TODO: figure out how to manage people disconnecting/reconnecting
    # maybe use sessions - which requires a secret key

# TODO: make an error handler for some of the big errors - 503, 404

# Create the storage for each 
lobbyMembership = {}
for i in range(4):
    lobbyMembership[i] = 0
    print(lobbyMembership[i])


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
    if(lobbyMembership[lobbyNumber] < 2):
        emit('exists', (lobbyNumber, 1)) # send a message back with true in the exists slot
    else:
        emit('exists', (lobbyNumber, 0)) # send a message back with false in the exists slot


# socket for managing response to clients connecting to the socket
@socketio.on('connect')
def connect():
    print('connected')
    # TODO: differentiate between connections in index and connections in lobby. check pathname


# socket for managing response to clients leaving the socket
@socketio.on('disconnect')
def disconnect():
    #TODO: check if they're in a room and remove them from it if so
    print('disconnected')

# manage connections to a specific lobby
@socketio.on('join')
def join(lobby):
    print("responding to a join message from lobby", lobby)
    # do another check to see if the lobby is full already
    if lobbyMembership[lobby] < 2:
        join_room(lobby)
        lobbyMembership[lobby] += 1
        emit('join', 1, to=lobby)
        print(lobbyMembership[lobby])
    else:
        emit('join', 0)


# run the server when you run this file
if (__name__ == '__main__'):
    socketio.run(app)