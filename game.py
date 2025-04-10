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

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, rooms, leave_room
import json

def ship_game(socketio):
    ######################### Objects #########################

    class Ship():
        timesHit = 0

        def __init__(self, hp):
            self.hp = hp
        
        def __str__(self):
            return f"I am a {self.hp} length ship that has been hit {self.timesHit} times!"

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
        def __init__(self, id):
            self.id = id
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


    p1 = Player(1)
    p2 = Player(2)
    players = [p1, p2]
    ########## Server crap ##########

    # Gives each player their initial maps, then tells one that it's their
    # turn and the other to wait.
    @socketio.on('send_initial_maps')
    def handleInitialMaps(json_id_and_map):
        # TODO: Stop this from running twice. Maybe wait to emit until we have both
        id_and_map = json.loads(json_id_and_map)
        if id_and_map[0] == 1: # Player 1's map
            p1.setup_ship_map(id_and_map[1])
        else:
            p2.setup_ship_map(id_and_map[1])
        # Both hit maps are empty, so I arbitrarily emit p1's map to both players.
        emit('rerender', json.dumps(p1.hit_map))
        # TODO: Tell someone that it's their move
        print("p1 ship map is")
        print(p1.ship_map)
        print("p2 ship map is")
        print(p2.ship_map)
    

    """
    Responds to guesses. The return value is the array version of a map that the client will use to rerender.
    """
    @socketio.on("guess")
    def handleGuess(id, coords):
        #TODO: This is where we would check for a ship to be destroyed, and send a destroyed symbol if so

        # if its user 1, check user 2's ship map for something, then update accordingly
        if id == 1:
            print("got into id1")
            if p2.ship_map[coords] != 0:
                p1.hit_map[coords] = 98
            else:
                p1.hit_map[coords] = 97
            return p1.hit_map
        # if its user 2, check user 1's ship map for something, then update accordingly
        elif id == 2:
            print("got into id2")
            if p1.ship_map[coords] != 0:
                p2.hit_map[coords] = 98
            else:
                p2.hit_map[coords] = 97
            return p2.hit_map
        # if the id is fucked, everything is broken
        else:
            return "BROKEN BROKEN BROKEN BROKEN"
        