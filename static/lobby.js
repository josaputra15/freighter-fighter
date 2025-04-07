var socket = io();
var lobby = window.location.pathname;

socket.emit("join", Number(lobby[1]));

socket.on("join", (success) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success);
        alert("You successfully joined the room");
    }
    else {
        console.log("heard back from join with success: " + success);
        alert("The room is already full.");
        // send to an error / index page. do not actually play/send messages
    }
})


for(let i = 0; i < 100; i++) {
    let tile = document.createElement("div");
    tile.innerText = "tile";
    tile.className = "tile";
document.getElementById("selfMap").appendChild(tile);
}

for(let i = 0; i < 100; i++) {
    let tile = document.createElement("div");
    tile.innerText = "tile";
    tile.className = "tile";
    document.getElementById("opponentMap").appendChild(tile);
}

///////////////////////////////////////////////////////

// id: Ship ID (1-5) - an int so that we can easily send ship maps via json
// hp: Size of the ship (eg, a 5-length ship has 5 hp)
// timesHit: Number of ship tiles (for this ship) that have been hit
class Ship{
    constructor(id, hp, timesHit){
        this.id = id
        this.hp = hp;
        this.timesHit = timesHit;
    }
}

// 
function sendInitialShipMaps(){
    const ship_map = [
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
    ]
    console.log(JSON.stringify(ship_map));
}

sendInitialShipMaps();