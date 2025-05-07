'''
2 players, each with a JavaScript renderer (aka web browser, but shush).
They each pass this file a JSON object that represents ship_map.
(For testing, ship_map is hard-coded.)
ship_map has 5 Ships. Each player is also assigned a ship_map, which contains where their OPPONENT
has attacked. It also tells whether or not a ship was in an attacked tile (and if it was destroyed).

Objects:
Player: ships_left, MAX_SHIPS, ship_map, hit_map
Ship: timesHit, hp
ship_map

For now, game.py will assume that the players will only send valid moves. Gamestate will have to be checked at some point though
'''

from flask_socketio import emit
import json

    ######################### Objects #########################

class Ship():
    timesHit = 0
    destroyed = False

    def __init__(self, hp):
        self.hp = hp
    
    def __str__(self):
        return f"I am a {self.hp} length ship that has been hit {self.timesHit} times!"

    def hit(self):
        self.timesHit += 1

        if(self.timesHit >= self.hp):
            self.destroyed = True
    
    def getDestroyed(self):
        return self.destroyed

'''
Contains ship_map: a 2d array with Ships and 0s (when there is no Ship) 
        hit_map: a 2d array with 0 for nothing, h for a hit, d for a destroyed ship tile, and m for a miss
            id: a number specifying which player this is (0 or 1)
'''
class Player():
    MAX_SHIPS = 5
    ships_left = MAX_SHIPS

    '''
    send_initial_maps is what the user's JavaScript client emits once it's finished setup. It consists
    of a user ID and a ship_map.
    ''' 
    def __init__(self, id, roomCode):
        self.id = id
        self.roomCode = roomCode
        self.s1 = Ship(2)
        self.s2 = Ship(3)
        self.s3 = Ship(3)
        self.s4 = Ship(4)
        self.s5 = Ship(5)

        self.hit_map = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ]
        self.ship_map = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ]
    
    # Adds ships (s1, s2, etc) to ship_map corresponding with the number in initial_map
    def setup_ship_map(self, initial_map):
        symbol_table = [0, self.s1, self.s2, self.s3, self.s4, self.s5]
        for i in range(0, 100):
            self.ship_map[i] = symbol_table[initial_map[i]]

    def destroyShip(self):
        self.ships_left -= 1
    
    def checkDestroyed(self):
        """
        Returns True if all of the player's ships are destroyed, and False if any are still alive.
        """
        for ship in [self.s1, self.s2, self.s3, self.s4, self.s5]:
            if not ship.getDestroyed(): 
                return False
        
        return True
    
    def getUserCode(self):
        return self.roomCode


# ===============================
#   Globals
# ===============================

GAMES = {}

# ===============================
#       Helper/Get Methods
# ===============================

"""
Creates a set of objects associated with a game, and associates them with a lobbyName in our collection of games
"""
def create_game(lobbyName, user1RoomCode, user2RoomCode):
    print("just created a room with name:", lobbyName)
    GAMES[lobbyName] = {}
    GAMES[lobbyName]["player1"] = Player(1, user1RoomCode)
    GAMES[lobbyName]["player2"] = Player(2, user2RoomCode)
    return lobbyName

"""
Returns the unpacked version of a particular player's SHIP map in a particular lobby
"""
def getShipMap(lobbyName, id):
    if id == 1:
        return GAMES[lobbyName]["player1"].ship_map
    elif id == 2:
        return GAMES[lobbyName]["player2"].ship_map
    else:
        raise Exception("received an ID that was neither 1 or 2")

"""
Returns the unpacked version of a particular player's HIT map in a particular lobby
"""
def getHitMap(lobbyName, id):
    if id == 1:
        return GAMES[lobbyName]["player1"].hit_map
    elif id == 2:
        return GAMES[lobbyName]["player2"].hit_map
    else:
        raise Exception("received an ID that was neither 1 or 2")

"""
Returns the room code for a specific player in a lobby
"""
def getRoomCode(lobbyName, id):
    if GAMES.get(lobbyName) == None:
        return False
    if id == 1:
        return GAMES[lobbyName]["player1"].roomCode
    elif id == 2:
        return GAMES[lobbyName]["player2"].roomCode
    else:
        raise Exception("received an ID that was neither 1 or 2")
    
def deleteGame(lobbyName):
    """
    Deletes a game from the game storage. Resets all the maps and stuff.

    Returns True if there was a game to delete, and False if there wasn't
    """
    if GAMES[lobbyName]:
        GAMES[lobbyName] = None
        return True
    return False

# =====================================
#   Socket Callbacks
#   - called by app.py
#   - named the same as the function in app.py
#   - return True if they succeed, False/exception if they fail
# =====================================


"""
Updates a particular lobby's ship map for a particular player.

Called in response to a 'send_initial_maps' emit in app.py

Returns True if it succeeds
"""
def handleInitialMaps(lobbyName, id, ship_map):
    if id == 1: # Player 1's map
        GAMES[lobbyName]["player1"].setup_ship_map(ship_map)
        return True
    else:
        GAMES[lobbyName]["player2"].setup_ship_map(ship_map)
        return True



def handleGuess(lobbyName, id, coords):
    """
    Updates the server's internal representation of a hit map based on a player's guess.
    If any ships are hit, we check both boards to see if we need to update our destroyed icons

    Returns True if the shot hit, and False if it didn't
    """
    print("handling a guess in lobby:", lobbyName)
    # if its user 1, check user 2's ship map for something, then update accordingly
    if id == 1:
        ship = GAMES[lobbyName]["player2"].ship_map[coords]
        # if there's something there, make it a hit, otherwise make it a miss
        if ship != 0:
            GAMES[lobbyName]["player1"].hit_map[coords] = 98
            ship.hit()
            return True
        else:
            GAMES[lobbyName]["player1"].hit_map[coords] = 97
            return False

    # if its user 2, check user 1's ship map for something, then update accordingly
    elif id == 2:
        ship = GAMES[lobbyName]["player1"].ship_map[coords]
        if ship != 0:
            GAMES[lobbyName]["player2"].hit_map[coords] = 98
            ship.hit()
            return True
        else:
            GAMES[lobbyName]["player2"].hit_map[coords] = 97
            return False
    
    # if the id is fucked, everything is broken
    else:
        raise Exception("In a guess, we received an ID that was neither 1 or 2")


def checkForDestroyedShips(lobbyName):
    """
    Looks through both maps to determine whether any ships are destroyed. Updates the appropriate hit map with destroyed icons if any are.
    """
    p1hitMap = GAMES[lobbyName]["player1"].hit_map
    p2hitMap = GAMES[lobbyName]["player2"].hit_map

    for coords in range(100):
        p1ship = GAMES[lobbyName]["player1"].ship_map[coords]
        p2ship = GAMES[lobbyName]["player2"].ship_map[coords]

        if p1ship != 0:
            if p1ship.getDestroyed():
                p2hitMap[coords] = 99
        
        if p2ship != 0:
            if p2ship.getDestroyed():
                p1hitMap[coords] = 99


def checkForVictory(lobbyName):
    """
    Checks whether any player has had all of their ships destroyed. If they have, returns the id of the winner.

    Returns ID of winner, and False if there is no winner yet.
    """
    if GAMES[lobbyName]["player1"].checkDestroyed():
        return 2
    if GAMES[lobbyName]["player2"].checkDestroyed():
        return 1
    
    return False