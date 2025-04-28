from dataclasses import dataclass
from random import random
from flask import Flask, jsonify, render_template, request
from flask_socketio import SocketIO, close_room, emit, join_room, rooms, leave_room
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

import json
import game

app = Flask(__name__)
socketio = SocketIO(app) # wrap socketio installation into new name - maybe makes a connection to our app too?

    # maybe use sessions - which requires a secret key

# TODO: make an error handler for some of the big errors - 503, 404

# TODO: figure out win conditions
# TODO: fix lobby creation
# TODO: close lobbies on disconnects

# TODO: add SQL stuff
    # this is probably just adding stats to big moments that just add to the sqllite DB
    # and also this is having a "stats page" linked from index that just shows those stats

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
#   Database Set-Up - pretty much stole this from HW3
#==============================

# Configure Database
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///stats.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy with Declarative Base
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
db.init_app(app)


# Define the Stat model using `Mapped` and `mapped_column`
# also make it a dataclass so we can easily turn it into json later
    # took that logic from https://www.reddit.com/r/flask/comments/vll4xu/comment/idwhc92/
@dataclass
class Stat(db.Model):
    __tablename__ = "stats"

    name: Mapped[str] = mapped_column(String(15), primary_key=True)
    number: Mapped[int] = mapped_column(Integer, nullable=False)

    # main difference from HW3 is that we just use the name as the primary key, because we only need these to fill the
    # persistent storage requirement, and won't be creating any new items once in deployment. Instead, we just update them to have +1 number whenever necessary
    def __init__(self, name: str, number: int):
        self.name = name
        self.number = number


# DATABASE UTILITY CLASS
class Database:
    def __init__(self):
        pass

    def get(self, name: str = None):
        """Retrieve a specific stat by name. If none passed, returns all stats"""
        if not name:
            return db.session.query(Stat).all()
        return db.session.get(Stat, name)

    def create(self, name: str, number: int):
        """Create a new stat. Should only be used when inititially creating the """
        new_stat = Stat(name=name, number=number)
        db.session.add(new_stat)
        db.session.commit()

    def update(self, name: str, number: int):
        """Update an existing stat."""
        stat = self.get(name)
        if stat:
            stat.name = name
            stat.number = number
            db.session.commit()

    def increment(self, name: str):
        """Increment the number for an existing stat by one"""
        stat = self.get(name)
        if stat:
            stat.name = name
            stat.number += 1
            db.session.commit()

    def delete(self, name: str):
        """Delete a stat."""
        stat = self.get(name)
        if stat:
            db.session.delete(stat)
            db.session.commit()

db_manager = Database()  # Create a database manager instance

#==============================
#   Database Routing
#==============================

# Initialize database
@app.before_request
def setup():
    with app.app_context():
        db.create_all()
        if not db_manager.get():  # If database is empty, add a sample entry
            db_manager.create("gamesStarted", 0)
            db_manager.create("gamesWon", 0)
            db_manager.create("guessesMade", 0)
            db_manager.create("guessesHit", 0)
            db_manager.create("guessesMissed", 0)

            print("Database initialized!")

# Reset the database
@app.route('/reset-db', methods=['GET', 'POST'])
def reset_db():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Database reset: success!")
    return "Database has been reset!", 200

#==============================
# Basic Routing
#==============================

# serve our index.html page when you go to the root page
@app.get("/")
def index():
    return render_template("index.html", numLobbies = NUM_LOBBIES)

@app.get("/rules")
def rules():
    return render_template("rules.html")

# serve our lobby.html page when you go to any other page. uses the passed lobby (second part of URL) as part of the template
@app.get("/<lobby>")
def lobby(lobby):
    return render_template("lobby.html", lobbyName=lobby)

@app.get("/stats")
def stats():
    return render_template("stats.html")

@app.get("/get_stat/<statName>")
def get_stat(statName):

    # took the jsonify logic from https://www.reddit.com/r/flask/comments/vll4xu/comment/idwhc92/
    if(statName == "started"):
        return (jsonify(db_manager.get("gamesStarted")), 200)
    elif(statName == "won"):
        return (jsonify(db_manager.get("gamesWon")), 200)
    elif(statName == "made"):
        return (jsonify(db_manager.get("guessesMade")), 200)
    elif(statName == "hit"):
        return (jsonify(db_manager.get("guessesHit")), 200)
    elif(statName == "missed"):
        return (jsonify(db_manager.get("guessesMissed")), 200)
    else:
        return "Invalid stat name", 405


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

            # kick out both players
            emit("closeRoom", to=roomName, broadcast=True)

            # reset the attributes for the lobby
            createLobby(roomName)

            # close the room
            close_room(roomName)

            # delete game from GAMES
            game.deleteGame(roomName)

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

    db_manager.increment("gamesStarted")

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
    db_manager.increment("guessesMade")

    success = game.handleGuess(lobbyName, id, coords)
    if success:
        db_manager.increment("guessesHit")
    else:
        db_manager.increment("guessesMissed")

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



def checkForVictory(lobbyName):
    """
    Asks game.py whether any player has won. If one has, emits messages to both players about the result.
    """
    victory = game.checkForVictory(lobbyName)
    if victory:
        # send a victory message with the winner's id as the content
        socketio.emit("victory", victory, to=game.GAMES[lobbyName]["player1"].getUserCode())
        socketio.emit("victory", victory, to=game.GAMES[lobbyName]["player2"].getUserCode())
        
        db_manager.increment("gamesWon")

# ===========================
#   Weird stuff to make this work in a way we never use
# ===========================

# run the server when you run this file
if (__name__ == '__main__'):
    socketio.run(app)