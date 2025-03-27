// 2 players, each with a Board. Each Board has two 2d arrays - shipmap, and a hitmap.
// The shipmap shows where their ships are (each square has a pointer to a Ship)
// There's a set number of Ships (5) that will have been placed.
// Each ship has an hp/size.
// Hit a ship, and its hp goes down. HP hits 0, and the number of ships left goes down. That goes to 0, you lose.

// Objects: Player, GameState, Ship, Board
// Player: shipsLeft, MAX_SHIPS, Board
// Board: shipMap (of Ships), hitMap (where YOU have BEEN ATTACKED), array of ships
// Ship: timesHit, hp
// GameState: 2 Players
// TODO: These should probably be in separate files, but I'll figure out how to do that later.

///////////////////////// Objects /////////////////////////

class Player{
    constructor(){
        // TODO: See if I can make this a proper const
        this.MAX_SHIPS = 5;
        this.shipsLeft = this.MAX_SHIPS;
        this.board = new Board();
        this.board.setup();
    }
}

class Board{
    constructor(){
        this.BOARD_DIMENSIONS = 10;
        // https://www.freecodecamp.org/news/javascript-2d-arrays/
        this.shipMap = [[]];
        // remember to NOT give a player the ability to see their opponent's ships with this! Remember that they can inspect their own objects, probably!
        this.hitMap = [[]];
        this.ships = [new Ship(2), new Ship(3), new Ship(3), new Ship(4), new Ship(5)];
        this.playerSetup();
    }

    /**
     * Reads every Ship in this.ships and has the player place them onto the board.
     */
    playerSetup(){
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
        this.ships.forEach(this.placeShip);
    }

    placeShip(){
        // TODO: First, basic implementation can be through alerts. Then once that logic is in, put it in the UI
    }
}

class Ship{
    constructor(hp){
        this.hp = hp;
        // I think instead of having a hit counter, I can just set the HP, place ships according to HP when they're first
        // created, and then decrement hp as the ships get hit. Save a variable, something something efficiency? Idk.
    }
}

class GameState{
    constructor(){
        this.p1 = new Player();
        this.p2 = new Player();
    }
}

///////////////////////// Functions /////////////////////////

//////////// Test functions ////////////
function runTests(){
    const board = new Board();
    console.log(board.shipMap);
}

//////////// Real functions ////////////

///////////////////////// 'Main' Function /////////////////////////

runTests();