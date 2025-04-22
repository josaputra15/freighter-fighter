//////////////////////////////////////////
//      GLOBALS DEFINITIONS
//////////////////////////////////////////
var mainShipMap = [
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
];


const debugShipMap = [
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

var socket = io();
const LOBBY_NAME = Number(window.location.pathname[1]);
var USER_ID;
const ASSET_PATH = "static/assets/";



//////////////////////////////////////////
//      SOCKET RESPONSES
//////////////////////////////////////////



socket.on("join", (success, usersConnected) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success + "\n ID = " + usersConnected);
        USER_ID = usersConnected;
        // alert("You successfully joined the room");

    }
    else {
        console.log("heard back from join with success: " + success);
        alert("The room is already full.");
        // send to an error / index page. do not actually play/send messages
    }
})

// Lobby is full; send the maps
socket.on("fullLobby", () => {
    document.getElementById("placement").classList.remove("hide");
    document.getElementById("waiting1").classList.add("hide");
});


/*
    Tells the user to redraw a particular map, using the array from the given JSON

    Calls a different function depending on what type it is
    mapType: either 'shipMap' or 'hitMap'
*/
socket.on("rerender", (mapType, jsonHitMap) =>{

    console.log(jsonHitMap);
    // unpack the JSON into an array
    const unpackedMap = JSON.parse(jsonHitMap);

    // if we've received a hit map, render that onto our hit map
    if(mapType === "hit") {
        rerender(unpackedMap, "opponentMap");
    }
    // otherwise we're rendering onto our ship map and need to combine them
    else if(mapType === "ship") {
        let newMap = combineHitAndShipMap(unpackedMap);
        rerender(newMap, "selfMap");
    }
    else {
        error("RECEIVED AN UNACCEPTABLE MAP TYPE IN A RERENDER MESSAGE");
    }
});

/**
 * Hides the post-placement waiting screen. Shows the gameboard. 
 * We will receive this at the same time as either a 'yourTurn' or 'notYourTurn', and those will determine turn order, not this
 */
socket.on("all_players_ready", () => {
    document.getElementById("waiting2").classList.add("hide");
    document.getElementById("gameboard").classList.remove("hide");
});



//////////////////////////////////////////
//      FUNCTION DEFINITIONS
//////////////////////////////////////////


/*
    Draws the correct icons in each slot of 'mapElement' based on the numbers from 'arrayMap'

    Does not accept JSON. Parse any JSON into an array before calling this
*/
function rerender(arrayMap, mapElement) {

    // array of all tiles in the element
    let tileList = document.getElementById(mapElement).children;
    
    // for each tile in the element, fill it with the asset it ought to have
    for (let i = 0; i < arrayMap.length; i++) {
        let tileContent = tileList[i].firstChild;
        let assets = convertNumberToAssets(arrayMap[i])
        tileContent.src = assets[0]
        tileContent.alt = assets[1]
    }
}

/*
    Creates a tile element, defaulting to having an empty space
*/
function createTile() {
    let tile = document.createElement("div");
    tile.className = "tile";

    let tileContent = document.createElement("img");
    tileContent.className = "tileContent";
    tileContent.src="static/assets/empty.svg";
    tileContent.width="100";
    tileContent.alt="empty";

    tile.appendChild(tileContent);
    return tile;
}

/*
    Combines a hit map from our opponent with our ship map to properly show icons from both sources
    
    Returns a 100-long array that is this combination
*/
function combineHitAndShipMap(hitMap){
    // using this to create an empty array: https://stackoverflow.com/a/45968309
    let newMap = Array.from({length: 100})

    for(let i = 0; i < 100; i++) {
        // if the hit map doesn't have anything in that slot, default to our ship map's icon
        console.log(hitMap[i]);
        if(hitMap[i] === 0) {
            console.log('used main');
            newMap[i] = mainShipMap[i]
        }
        // otherwise use the thing from the hit map
        else {
            newMap[i] = hitMap[i];
        }
    }
    return newMap
}

/*
    Send our initial ship map to the server, and override our current main ship map in this file with whatever that map is
*/
function sendInitialShipMap(newShipMap){
    
    // update our global shipMap var in lobby.js to be the new map
    mainShipMap = newShipMap;

    // send our new shipMap to python so it can associate it with the right user id
    socket.emit("send_initial_maps", LOBBY_NAME, USER_ID, newShipMap);
}


/*
    Converts a number into an svg-altText combination, using our number -> symbol rules from the API Reference

    Returns: array where [0] is the svg src text, and [1] is the alt text
*/
function convertNumberToAssets(number) {
    switch(number) {
        case 0:
            return [ASSET_PATH + "empty.svg", "empty"];
        case 1:
            return [ASSET_PATH + "2long.svg", "2 long ship piece"];
        case 2:
            return [ASSET_PATH + "3long.svg", "3 long ship piece"];
        case 3:
            return [ASSET_PATH + "3long.svg", "3 long ship piece"];
        case 4:
            return [ASSET_PATH + "4long.svg", "4 long ship piece"];
        case 5:
            return [ASSET_PATH + "5long.svg", "5 long ship piece"];
        case 97:
            return [ASSET_PATH + "miss.svg", "hit"];
        case 98:
            return [ASSET_PATH + "hit.svg", "hit"];
        case 99:
            return [ASSET_PATH + "destroyed.svg", "destroyed ship"];
        // Buttons / UI tiles
        case 200:
            return [ASSET_PATH + "error.svg", "ready button graphic (error image, not yet added"]
        default:
            return [ASSET_PATH + "error.svg", "error"];
    }
}

/**
 * Fills the "selfMap" HTML element with each of its tiles. They are inactive, so unclickable.
 */
function generateSelfMap() {
    let selfMap = document.getElementById("selfMap");

    for(let i = 0; i < 100; i++) {
        let tile = createTile();
        tile.classList.add("inactive");
        selfMap.appendChild(tile);
    }
}

/**
 * Fills the "opponentMap" HTML element with each of its tiles AND gives them their callbacks
 */
function generateOpponentMap() {
    let opponentMap = document.getElementById("opponentMap");
    for(let i = 0; i < 100; i++) {
        let tile = createTile();
        tile.addEventListener("click", () => {
            guess(i);
        })
        opponentMap.appendChild(tile);
}

/**
 * Makes a guess using the passed index. Sends the guess to python, updates turn order, and deactivates tile
 * @param {BigInt} index 
 */
function guess(index) {
    // find the tile element
    let tile = document.getElementById("opponentMap").children[index]
    tile.classList.add("inactive");

    // emit a guess request with id & slot
    // the callback to this request is a new map which we rerender onto opponentMap
    socket.emit("guess", LOBBY_NAME, USER_ID, index);
}

}
/////////////////////////////////////////////////////////////
//      CODE THAT ACTUALLY RUNS WHEN WE LOAD THIS FILE
////////////////////////////////////////////////////////////



socket.emit("join", LOBBY_NAME);

generateSelfMap();

generateOpponentMap();
