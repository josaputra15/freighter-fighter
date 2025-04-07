# 2 players, each with a Board. Each Board has two 2d arrays - shipmap, and a hitmap.
# The shipmap shows where their ships are (each square has a pointer to a Ship)
# There's a set number of Ships (5) that will have been placed.
# Each ship has an hp#size.
# Hit a ship, and its hp goes down. HP hits 0, and the number of ships left goes down. That goes to 0, you lose.

# Objects: Player, GameState, Ship, Board
# Player: shipsLeft, MAX_SHIPS, Board
# Board: shipMap (of Ships), hitMap (where YOU have BEEN ATTACKED), array of ships
# Ship: timesHit, hp
# GameState: 2 Players
# TODO: These should probably be in separate files, but I'll figure out how to do that later.

'''
That's all NERD stuff, we're doing PYTHON on the SERVER like GAMERS

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
'''
class Player():
    MAX_SHIPS = 5
    ships_left = MAX_SHIPS

    def __init__(self):
        s1 = Ship(2)
        s2 = Ship(3)
        s3 = Ship(3)
        s4 = Ship(4)
        s5 = Ship(5)
        self.ship_map = [
            [00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
            [00, 00, 00, 00, 00, s4, s4, s4, s4, 00],
            [00, 00, s1, s1, 00, 00, 00, 00, 00, 00],
            [00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
            [00, 00, 00, 00, 00, 00, s2, 00, s3, 00],
            [00, 00, 00, 00, 00, 00, s2, 00, s3, 00],
            [00, 00, 00, 00, 00, 00, s2, 00, s3, 00],
            [00, 00, 00, 00, 00, 00, 00, 00, 00, 00],
            [s5, s5, s5, s5, s5, 00, 00, 00, 00, 00],
            [00, 00, 00, 00, 00, 00, 00, 00, 00, 00]
        ]
        
        self.hit_map = [
            [000, 000, 000, 000, 000, "m", 000, 000, 000, 000],
            [000, 000, 000, 000, 000, "h", 000, 000, 000, 000],
            [000, 000, "d", "d", 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000],
            [000, 000, 000, 000, 000, 000, 000, 000, 000, 000]
        ]

# Takes the player ship_maps and sends them to the lobby (JavaScript)
# with JSON
def send_hit_map(player):
    map = player.ship

# Main functions make me happy and give me peace of mind
def main():
    p1 = Player()
    p2 = Player()
    # p1.ship_map = something from p1's client
    # p2.ship_map = something from p2's client

main()