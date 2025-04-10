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
var me;
const assetLoc = "static/assets/";

socket.emit("join", Number(lobby[1]));

socket.on("join", (success, usersConnected) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success + "\n ID = " + usersConnected);
        me = new Player(usersConnected);
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
    const DEBUG_decodedHitMap = JSON.parse(jsonHitMap);
    console.log(DEBUG_decodedHitMap);

    rerender(jsonHitMap, "selfMap");
});


/*
    Creates a tile element, defaulting to having an empty space
*/
function createTile() {
    let tile = document.createElement("div");
    tile.className = "tile";
    tile.classList.add("empty")

    let tileContent = document.createElement("img");
    tileContent.className = "tileContent";
    tileContent.src="static/assets/empty.svg";
    tileContent.width="100";
    tileContent.alt="empty";

    tile.appendChild(tileContent);
    return tile;
}

/*
    Rerenders a particular element based on the given JSON. 
*/
function rerender(jsonHitMap, mapElement) {

    // actual function
    const unpackedMap = JSON.parse(jsonHitMap);

    // DEBUG EXAMPLE MAP
    // const unpackedMap = [
    //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    //     0, 0, 0, 0, 0, 4, 4, 4, 4, 0,
    //     0, 0, 1, 1, 0, 0, 0, 0, 0, 0,
    //     0, 0, 97, 0, 0, 0, 0, 0, 0, 0,
    //     0, 0, 0, 0, 0, 0, 2, 0, 3, 0,
    //     0, 0, 0, 0, 0, 0, 2, 0, 3, 0,
    //     0, 0, 97, 0, 97, 0, 2, 0, 3, 0,
    //     0, 0, 0, 0, 0, 0, 0, 0, 97, 0,
    //     5, 5, 5, 5, 5, 0, 0, 0, 0, 0,
    //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    // ]
    let tileList = document.getElementById(mapElement).children;
    
    for (let i = 0; i < 100; i++) {
        let tileContent = tileList[i].firstChild;

        switch(unpackedMap[i]) {
            case 0:
                tileContent.src = assetLoc + "empty.svg";
                tileContent.alt = "empty"
                break;
            case 1:
                tileContent.src = assetLoc + "2long.svg";
                tileContent.alt = "2 long ship piece"
                break;
            case 2:
                tileContent.src = assetLoc + "3long.svg";
                tileContent.alt = "3 long ship piece"
                break;
            case 3:
                tileContent.src = assetLoc + "3long.svg";
                tileContent.alt = "3 long ship piece"
                break;
            case 4:
                tileContent.src = assetLoc + "4long.svg";
                tileContent.alt = "4 long ship piece"
                break;
            case 5:
                tileContent.src = assetLoc + "5long.svg";
                tileContent.alt = "5 long ship piece"
                break;
            case 97:
                tileContent.src = assetLoc + "miss.svg";
                tileContent.alt = "miss"
                break;
            case 98:
                tileContent.src = assetLoc + "hit.svg";
                tileContent.alt = "hit"
                break;
            case 99:
                tileContent.src = assetLoc + "destroyed.svg";
                tileContent.alt = "destroyed tile"
                break;
        }
    }
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