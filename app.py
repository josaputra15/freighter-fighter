from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app) # wrap socketio installation into new name - maybe makes a connection to our app too?

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
def handleExists(number):
    emit('exists', (number, 1)) # send a message back, with type 'exists' and a few parameters


# socket for managing response to clients connecting to the socket
@socketio.on('connect')
def connect():
    print('connected')
    # TODO: differentiate between connections in index and connections in lobby. namespaces? or can we use if/else logic


# socket for managing response to clients leaving the socket
@socketio.on('disconnect')
def disconnect():
    print('disconnected')



# run the server when you run this file
if __name__ == '__main__':
    socketio.run(app)