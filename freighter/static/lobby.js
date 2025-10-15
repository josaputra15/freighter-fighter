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
const LOBBY_NAME = Number(window.location.pathname.split("/")[2]);
var USER_ID;
const ASSET_PATH = "/static/assets/";
// Tracks which tile is being highlighted for keyboard controls
var tileToGuess = 44;



//////////////////////////////////////////
//      SOCKET RESPONSES
//////////////////////////////////////////

/**
 * Closes the room. Removes the socket from the room, and redirects you to the main page. Should also probably show an alert
 */
socket.on("closeRoom", () => {
    console.log("room closed");
    alert("You or your opponent disconnected from the room. Redirecting back to the home page");
    window.location.replace("/");
})

/**
 * Check whether there is room in the lobby. Join and create our ID if there is, fail if not
 */
socket.on("join", (success, usersConnected) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success + "\n ID = " + usersConnected);
        USER_ID = usersConnected;

        // add your user ID to the main title
        document.getElementsByTagName("h1")[0].innerText += (" " + USER_ID)

        // alert("You successfully joined the room");

    }
    else {
        console.log("heard back from join with success: " + success);
        alert("The room is already full.");
        // send to an error / index page. do not actually play/send messages
    }
})


/**
 * Both players are connected to the lobby. Show placement and update the status div.
 */
socket.on("fullLobby", () => {
    document.getElementById("status").innerText = "Place your ships!";
    document.getElementById("placement").classList.remove("hide");
});


/**
    Tells the user to redraw a particular map, using the array from the given JSON

    Calls a different function depending on what type it is
    mapType: either 'shipMap' or 'hitMap'
*/
socket.on("rerender", (mapType, jsonHitMap) =>{
    // unpack the JSON into an array
    const unpackedMap = JSON.parse(jsonHitMap);

    // if we've received a hit map, render that onto our hit map
    if(mapType === "hit") {
        rerender(unpackedMap, "opponentMap");
    }
    // otherwise we're rendering onto our ship map and need to combine them
    else if(mapType === "ship") {
        let newMap = combineHitAndShipMap(unpackedMap, mainShipMap);
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
    document.getElementById("gameboard").classList.remove("hide");
    console.log("received an all players ready message");
});

/**
 * Changes whose turn it is. If it's now your turn, enable guessing. If it's the opponent's turn, disable guessing
 */
socket.on("turnUpdate", (id) => {
    console.log("received a turn update message");

    if (id === USER_ID) {
        // it's my turn - activate all of the appropriate tiles and update the ticker
        console.log("my turn!")
        document.getElementById("status").innerText = "It's your turn to guess";
        enableGuessing()
        document.addEventListener("keydown", handleKbGuesses);
    }
    else {
        // it's not my turn - deactive opponent map and update the ticker
        document.getElementById("status").innerText = "Waiting for your opponent to guess";
        disableGuessing()
        document.removeEventListener("keydown", handleKbGuesses);
        console.log("not my turn :(")
    }
})

/**
 * Handles a victory. If you won, it shows you that message. If you lost, it shows you that message.
 * TODO: make the logic in here make more sense
 * TODO: maybe make it so you see where the remaining ships were if you lost?
 */
socket.on("victory", (id) => {
    console.log("received a victory message")
    disableGuessing();
    if(id === USER_ID) {
        win();
        socket.emit("send_lost_map", LOBBY_NAME, USER_ID, mainShipMap);
    }
    else {
        lose();
    }
})

socket.on("sent_lost_map", (map, hitMap) => {
    // Opponent's map: has a number wherever there's a ship. Can be matched with the funny graphics number
    // call combineHitAndShipMap but with other variables - make map take those args instead of just pulling the global var?
    let enemyMap = combineHitAndShipMap(hitMap, map);
    rerender(enemyMap, "opponentMap");
});

//////////////////////////////////////////
//      FUNCTION DEFINITIONS
//////////////////////////////////////////

function makeHomeHrefDiv(){
    let homeRoute = document.createElement("a");
    homeRoute.href = "/";
    homeRoute.innerText = "Return to homepage";
    return homeRoute;
}

//TODO: It's really really easy to cheat. Which is nice for debugging...
function win(){
    document.getElementById("status").innerText = "You won by destroying your opponent's last ship!";
    document.getElementById("status").appendChild(document.createElement("br"));
    document.getElementById("status").appendChild(makeHomeHrefDiv());
    document.getElementById("lobbyuser").innerText = "Winner POV";
    document.getElementById("lobbyuser").classList.add("wincolor");
    let selfChildren = document.getElementById("selfMap").children
    let opponentChildren = document.getElementById("opponentMap").children;
    for(let i = 0; i < selfChildren.length; i++){
        selfChildren[i].classList.add("wincolor");
        opponentChildren[i].classList.add("wincolor");
    }
    console.log("I WON!!!!!!!!!!");
}

function lose(){
    document.getElementById("status").innerText = "You lost because your opponent destroyed your last ship :(";
    document.getElementById("status").appendChild(document.createElement("br"));
    document.getElementById("status").appendChild(makeHomeHrefDiv());
    document.getElementById("lobbyuser").innerText = "You Lost";
    document.getElementById("lobbyuser").classList.add("losecolor");
    let selfChildren = document.getElementById("selfMap").children
    let opponentChildren = document.getElementById("opponentMap").children;
    for(let i = 0; i < selfChildren.length; i++){
        selfChildren[i].classList.add("losecolor");
        opponentChildren[i].classList.add("losecolor");
    }

    console.log("I LOST :(((((((((((");
}

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
    tileContent.src="/static/assets/empty.svg";
    tileContent.width="100";
    tileContent.alt="empty";
    tileContent.draggable = false;

    tile.appendChild(tileContent);
    return tile;
}

/*
    Combines a hit map from our opponent with our ship map to properly show icons from both sources

    Returns a 100-long array that is this combination
*/
function combineHitAndShipMap(hitMap, shipMap){
    // using this to create an empty array: https://stackoverflow.com/a/45968309
    let newMap = Array.from({length: 100})

    for(let i = 0; i < 100; i++) {
        // if the hit map doesn't have anything in that slot, default to our ship map's icon
        if(hitMap[i] === 0) {
            newMap[i] = shipMap[i]
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
}

/**
 * Makes a guess using the passed index. Sends the guess to python, updates turn order, and deactivates tile
 * @param {BigInt} index
 */
function guess(index) {
    // find the tile element
    let tile = document.getElementById("opponentMap").children[index]
    tile.classList.add("guessed");
    tile.classList.remove("highlighted2");

    // emit a guess request with id & slot
    // the callback to this request is a new map which we rerender onto opponentMap
    socket.emit("guess", LOBBY_NAME, USER_ID, index);
}


/**
 * Makes all unguessed tiles in opponentMap active
 */
function enableGuessing() {
    let tileList = document.getElementById("opponentMap").children;

    for(let i=0; i < 100; i++) {
        let tile = tileList[i]
        // if the tile has NOT been guessed
        if(!tile.classList.contains("guessed")) {
            tile.classList.remove("inactive")
        }
    }
}

/**
 * Makes all tiles in opponentMap inactive.
 */
function disableGuessing() {
    let tileList = document.getElementById("opponentMap").children;

    for(let i=0; i < 100; i++) {
        let tile = tileList[i]
        tile.classList.add("inactive");
    }
}

/**
 * Routes keyboard input to its corresponding function
 */
function handleKbGuesses(event){
    switch(event.key){
        case "ArrowUp":
            event.preventDefault();
            onArrow(0);
            break;
        case "ArrowDown":
            event.preventDefault();
            onArrow(1);
            break;
        case "ArrowLeft":
            event.preventDefault();
            onArrow(2);
            break;
        case "ArrowRight":
            event.preventDefault();
            onArrow(3);
            break;
        case "Enter":
            onEnter();
            break;
    }
}

/**
 * Moves and highlights the currently selected tile to make a guess in
 * @param {int} direction [Up, down, left, right] -> [0, 1, 2, 3]
 */
function onArrow(direction){
    let destination;
    switch(direction){
        case 0:
            destination = tileToGuess - 10;
            break;
        case 1:
            destination = tileToGuess + 10;
            break;
        case 2:
            destination = tileToGuess - 1;
            break;
        case 3:
            destination = tileToGuess + 1;
            break;
    }
    if(destination < 0 || destination > 99)
        return;

    let boardChildren = document.getElementById("opponentMap").children;
    boardChildren[tileToGuess].classList.remove("highlighted2");
    tileToGuess = destination;
    boardChildren[tileToGuess].classList.add("highlighted2");
}

/**
 * Makes a guess when the enter key is pressed
 */
function onEnter(){
    let boardChildren = document.getElementById("opponentMap").children;
    if(!boardChildren[tileToGuess].classList.contains("inactive")){
        guess(tileToGuess);
    }
}

/////////////////////////////////////////////////////////////
//      CODE THAT ACTUALLY RUNS WHEN WE LOAD THIS FILE
////////////////////////////////////////////////////////////



socket.emit("join", LOBBY_NAME);

generateSelfMap();

generateOpponentMap();
