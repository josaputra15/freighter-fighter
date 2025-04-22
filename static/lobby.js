

///////////////// GLOBALS /////////////////
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

///////////////// Joining logic /////////////////

socket.emit("join", LOBBY_NAME);

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
    // https://socket.io/docs/v4/emitting-events/
    console.log("ran initial function")
    // TODO make this work
 
    // // in the short term, just use debug for our newShipMap
    // newShipMap = debugShipMap;
    // form our new ship map from the placed ships currently on screen
    // parseIntoShipMap()
    // update our global shipMap var in lobby.js
    mainShipMap = newShipMap;

    // send our new shipMap to python so it can associate it with the right id
    socket.emit("send_initial_maps", LOBBY_NAME, USER_ID, newShipMap);
}


// Lobby is full; send the maps
socket.on("fullLobby", () => {
    // sendInitialShipMap(placementMap);

    console.log("main ship map was this, right before we called selfMap version of rerender")
    console.log(mainShipMap)
    // rerender(debugShipMap, "selfMap")
    rerender(mainShipMap, "selfMap");
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
    Rerenders a particular element based on the given JSON. 
*/
function rerender(arrayMap, mapElement) {

    // console.log("given map element was " + mapElement)
    let tileList = document.getElementById(mapElement).children;
    
    // console.log("array map was")
    // console.log(arrayMap)

    for (let i = 0; i < arrayMap.length; i++) {
        let tileContent = tileList[i].firstChild;
        let assets = convertNumberToAssets(arrayMap[i])
        tileContent.src = assets[0]
        tileContent.alt = assets[1]
    }
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

// generate selfMap
for(let i = 0; i < 100; i++) {
    let tile = createTile();
    tile.classList.add("inactive");
    document.getElementById("selfMap").appendChild(tile);
}

// generate opponentMap
for(let i = 0; i < 100; i++) {
    let tile = createTile();
    tile.addEventListener("click", () => {
        // TODO: check whether its your turn to guess
        // TODO: move this event listener shit out of this, and encapsulate into a function
        tile.classList.add("inactive");

        // emit a guess request with id & slot
        // the callback to this request is a new map which we rerender onto opponentMap
        socket.emit("guess", LOBBY_NAME, USER_ID, i);
        // send a guess to the server
            // the server will check the guess against the opponent's ship map, and then send a rerender for opponentMap
    })
    document.getElementById("opponentMap").appendChild(tile);
}

///////////////// Joining logic /////////////////

/**
 * Brings the game into view.
 */
socket.on("all_players_ready", () => {
    document.getElementById("waiting").classList.add("hide");
    document.getElementById("gameboard").classList.remove("hide");
});