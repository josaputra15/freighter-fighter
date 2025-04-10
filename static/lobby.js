///////////////// Game logic /////////////////
// id: Ship ID (1-5) - an int so that we can easily send ship maps via json
// hp: Size of the ship (eg, a 5-length ship has 5 hp)
// timesHit: Number of ship tiles (for this ship) that have been hit
class Ship{
    constructor(id, hp, timesHit){
        this.id = id;
        this.hp = hp;
        this.timesHit = timesHit;
    }
}

class Player{
    constructor(id){
        this.id = id;
        this.ship_map = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 4, 4, 4, 4, 0,
            0, 0, 1, 1, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 2, 0, 3, 0,
            0, 0, 0, 0, 0, 0, 2, 0, 3, 0,
            0, 0, 0, 0, 0, 0, 2, 0, 3, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            5, 5, 5, 5, 5, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ];
    }

    // Send finished ship maps to the server. This'll allow the user to set maps up
    // later on, but for now, there's a predefined map.
    sendInitialShipMaps(){
        // https://socket.io/docs/v4/emitting-events/
        socket.emit("send_initial_maps", JSON.stringify([this.id, this.ship_map]));
    }
}



///////////////// Communication with the server /////////////////

var socket = io();
var lobby = window.location.pathname;

socket.emit("join", Number(lobby[1]));

socket.on("join", (success, usersConnected) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success + "\n ID = " + usersConnected);
        const me = new Player(usersConnected);
        alert("You successfully joined the room");

    }
    else {
        console.log("heard back from join with success: " + success);
        alert("The room is already full.");
        // send to an error / index page. do not actually play/send messages
    }
})

// Lobby is full; send the maps
socket.on("fullLobby", () => {
    me.sendInitialShipMaps();
});

// Re-render is called when a player makes a move; it gives them the map of where their enemy
// has attacked (jsonHitMap) and (will) call(s) a Player method that re-renders their boards.
socket.on("rerender", (jsonHitMap) =>{
    console.log("Initial setup would be complete, and re-render would be called on the empty json hit map");
    // TODO: Make and call a functional rerender function
    const DEBUG_decodedHitMap = JSON.parse(jsonHitMap);
    console.log(DEBUG_decodedHitMap);
});

// Function to generate tile divs
function createTile() {
    let tile = document.createElement("div");
    tile.className = "tile";
    tile.classList.add("empty")

    let tileContent = document.createElement("img");
    tileContent.className = "tileContent";
    tileContent.src="static/assets/wave.svg";
    tileContent.width="100";
    tileContent.alt="empty";

    tile.appendChild(tileContent);
    return tile;
}


function rerender(responseJSON) {
    // unpack it into the array
    // go through the array and set tileContent for each tile to accurately match the data
}


// generate selfMap
for(let i = 0; i < 100; i++) {
    let tile = createTile();
    document.getElementById("selfMap").appendChild(tile);
}

// generate opponentMap
for(let i = 0; i < 100; i++) {
    let tile = createTile();
    document.getElementById("opponentMap").appendChild(tile);
}