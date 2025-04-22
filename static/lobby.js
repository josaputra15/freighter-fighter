

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

const readyButton = document.getElementById("readyButtonDiv").firstChild;
const shipSourceMap = [
    5, 4, 3, 2, 1,
    5, 4, 3, 2, 1,
    5, 4, 3, 2, 0,
    5, 4, 0, 0, 0,
    5, 0, 0, 0, 0
];
const placementMap = [
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
// When a ship is sort of in limbo and being placed, this tracks which ship it is.
let shipToPlace = 0;
// Where the user has said they want to place a ship. -1 means nothing is currently being placed.
let placementIndex = -1;

/**
 * Deactivates certain tiles, such that hovering over them doesn't display anything.
 * @param {*} arrayMap An array with a 0 for any corresponding tile you want deactivated.
 * @param {*} mapElement The thing you want to deactivate tiles from. This should be its ID (eg, "placementBoard")
 */
function deactivateUnused(arrayMap, mapElement){
    let tileList = document.getElementById(mapElement).children;
    for(let i = 0; i < arrayMap.length; i++){
        if(arrayMap[i] == 0){
            tileList[i].classList.add("inactive");
        }
    }
}

/**
 * Removes the ship from the placement source and half-places it
 * onto the actual gameboard.
 */
function prepareShip(event){
    let shipIndex = getShipFromClick(event);
    // If we have a ship "picked up" and click back on the placement source, this puts it back there.
    if(shipToPlace !== 0){
        returnShipToSource();
        if(shipIndex === 0)
            return;
    }

    shipToPlace = shipIndex;
    // remove it from the source
    for(let i = 0; i < shipSourceMap.length; i++){
        if(shipSourceMap[i] === shipIndex){
            shipSourceMap[i] = 0;
        }
    }
    activateBoard();
    rerender(shipSourceMap, "shipSource");
}

/**
 * Removes the ship from the gameboard and half-places it back.
 */
function moveShip(event){
    let shipIndex = getShipFromClick(event);
    shipToPlace = shipIndex;
    // Remove it from the placement board
    for(let i = 0; i < placementMap.length; i++){
        if(placementMap[i] === shipIndex){
            placementMap[i] = 0;
        }
    }
    activateBoard();
    // TODO: As a stretch thing, maybe add a way to re-add the ship to the source board.
    deactivateEntireBoard("shipSource");
    rerender(placementMap, "placementBoard");
}

/**
 * Lets the user click tiles on the placement board, except where there are already ships.
 */
function activateBoard(){
    let boardChildren = document.getElementById("placementBoard").children;
    for(let i = 0; i < boardChildren.length; i++){
        if(placementMap[i] === 0)
            boardChildren[i].classList.remove("inactive");
        else
            boardChildren[i].classList.add("inactive");
    }
}

/**
 * Makes the entire specified board unclickable.
 * @param {string} mapElement The HTML ID of the board you want to make unclickable.
 */
function deactivateEntireBoard(mapElement){
    let myChildren = document.getElementById(mapElement).children;
    for(tile of myChildren){
        tile.classList.add("inactive");
    }
}

/**
 * If a user clicks a ship on the placement source and clicks back onto one of the source tiles
 * it came from, this function is called to put it back.
 * Uses the global variable shipToPlace to determine which ship to put back down.
 */
function returnShipToSource(){
    // For the sake of being able to change underlying variables without breaking as many things,
    // this function is a little ridiculous sometimes. Maybe worth just hard-coding more things?
    // It'll still need to be fixed up if we add game modes with more/less(?) ships.
    let length = getShipLengthFromId(shipToPlace);

    for(let i = 5-shipToPlace; i < length*(Math.sqrt(shipSourceMap.length)); i = i+5){
        shipSourceMap[i] = shipToPlace;
    }

    shipToPlace = 0;
    rerender(shipSourceMap, "shipSource");
    resetActivations();
    disableReadyButton();
}

/**
 * Gets the length of a ship given its numbering.
 */
function getShipLengthFromId(shipID){
    let length;
    if (shipID < 3)
        length = shipID + 1;
    else
        length = shipID;
    return length;
}

/**
 * If a tile in the placement source or board is clicked and you need to find out which ship was clicked,
 * the event listener should call this function, passing the event in, to find out the corresponding
 * integer value of the ship in that tile.
 */
function getShipFromClick(event){
    if(event.currentTarget.parentElement === document.getElementById("shipSource"))
        return shipSourceMap[getTileIndexFromClick(event)];
    return placementMap[getTileIndexFromClick(event)];
}

/**
 * If you click the nth tile of a grid, this tells you what n is.
 */
function getTileIndexFromClick(event){
    // https://www.w3schools.com/jsref/prop_node_parentelement.asp
    let me = event.currentTarget;
    let siblings = me.parentElement.children;
    for(let i = 0; i < siblings.length; i++){
        if(me === siblings[i]){
            return i;
        }
    }
    alert("ERROR: Couldn't figure out which tile was clicked. (See getTileIndexFromClick())");
}

/**
 * Starts the process of placing a ship. Sets the first edge of the placement according to what
 * 'clicked' is, and prepares to finish placing the ship.
 * @param {Integer} clicked The index of the tile the user has clicked
 */
function startPlacement(clicked){
    placementIndex = clicked;
    deactivateUnused(shipSourceMap, "shipSource");
    let valid = getValidSpots(clicked);
    if(valid.length === 0){ // No valid spots
        alert("You can't place a ship starting in that tile");
        returnShipToSource();
        resetPlacement();
        return;
    }
    highlightPlacementTiles(valid);
    deactivateInvalidPlacementTiles();
}

/**
 * Once valid tiles for placement are highlighted, call this function to make
 * non-highlighted tiles non-clickable
 */
function deactivateInvalidPlacementTiles(){
    let boardChildren = document.getElementById("placementBoard").children;
    deactivateEntireBoard("shipSource");
    for(let i = 0; i < boardChildren.length; i++){
        if(!boardChildren[i].classList.contains("highlighted")){
            boardChildren[i].classList.add("inactive");
        }
    }
}

/**
 * Checks which tiles should be clickable and activates/deactivates them.
 * This assumes no ship is currently being placed.
 */
function resetActivations(){
    let sourceChildren = document.getElementById("shipSource").children;
    let boardChildren = document.getElementById("placementBoard").children;
    for(let i = 0; i < sourceChildren.length; i++){
        if(shipSourceMap[i] != 0)
            sourceChildren[i].classList.remove("inactive");
        else
            sourceChildren[i].classList.add("inactive");
    }
    for(let i = 0; i < boardChildren.length; i++){
        if(placementMap[i] != 0)
            boardChildren[i].classList.remove("inactive");
        else
            boardChildren[i].classList.add("inactive");
    }
}

/**
 * Highlights any tiles specified by toHighlight in the placement board.
 */
function highlightPlacementTiles(toHighlight){
    let tiles = document.getElementById("placementBoard").children;
    for(let i = 0; i < tiles.length; i++){
        if(toHighlight.includes(i)){
            tiles[i].classList.add("highlighted");
        }
    }
}

/**
 * Removes all highlights from the placement board AND deactivates those tiles from clickability.
 */
function removeHighlights(){
    let tiles = document.getElementById("placementBoard").children;
    for(let i = 0; i < tiles.length; i++){
        tiles[i].classList.remove("highlighted");
        tiles[i].classList.add("inactive");
    }
}

/**
 * Given an index (for the placement map), this checks how ships can be placed if they start from there.
 * (ie, if they'd go off the edge and if they'd collide with another ship.)
 * It returns an array with all valid indices to click next.
 */
function getValidSpots(clicked){
    // https://www.geeksforgeeks.org/how-dynamic-arrays-work-in-javascript/
    let length = getShipLengthFromId(shipToPlace);
    let col = clicked % 10;
    let row = Math.floor(clicked / 10);
    let left = [];
    let right = [];
    let up = [];
    let down = [];
    // Can it go left?
    if(row === Math.floor((clicked - length + 1)/10)){
        for(let i = clicked - 1; i > clicked - length; i--){
            if(placementMap[i] !== 0){
                left = [];
                break;
            }
            left.push(i);
        }
    }
    // Can it go right?
    if(row === Math.floor((clicked + length - 1)/10)){
        for(let i = clicked + 1; i < clicked + length; i++){
            if(placementMap[i] !== 0){
                right = []
                break;
            }
            right.push(i);
        }
    }
    // Can it go above?
    if(col === (clicked+10 - length*10) % 10){
        for(let i = clicked - 10; i > clicked - 10*length; i = i - 10){
            if(placementMap[i] !== 0){
                up = [];
                break;
            }
            up.push(i);
        }
    }
    // Can it go below?
    if(col === (clicked-10 + length*10) % 10){
        for(let i = clicked + 10; i < clicked + 10*length; i = i + 10){
            if(placementMap[i] !== 0){
                down = [];
                break;
            }
            down.push(i);
        }
    }
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat
    return left.concat(right, up, down);
}

/**
 * Called after the user clicks the second tile they want the ship to be at.
 * @param {Integer} clicked The index of the tile the user has clicked
 */
function finishPlacement(clicked){
    let length = getShipLengthFromId(shipToPlace);

    // To the left or above
    if(clicked < placementIndex){
        if(clicked + 6 > placementIndex){ // To the left
            for(let i = placementIndex; i > placementIndex-length; i--){
                placementMap[i] = shipToPlace;
            }
        }
        else { // Above
            for(let i = placementIndex; i > placementIndex-length*10 ; i = i-10){
                placementMap[i] = shipToPlace;
            }
        }
    } else { // To the right or below
        if(clicked - 6 < placementIndex){ // To the right
            for(let i = placementIndex; i < placementIndex+length; i++){
                placementMap[i] = shipToPlace;
            }
        }
        else { // Below
            for(let i = placementIndex; i < placementIndex+length*10; i = i+10){
                placementMap[i] = shipToPlace;
            }
        }
    }

    removeHighlights();
    resetActivations();
    rerender(placementMap, "placementBoard");
    resetPlacement();
    tryReadyButton();
}

/**
 * Sees if all ships have been placed. If so, activates the ready button.
 * TODO: See if readying up while moving a ship sends a board with only 4 ships
 */
function tryReadyButton(){
    for(ship of shipSourceMap){
        if(ship !== 0)
            return;
    }

    enableReadyButton();
}

/**
 * Undoes the results of startPlacement. Meant to be called after finishing placement,
 * regardless of whether or not placement was valid
 */
function resetPlacement(){
    placementIndex = -1;
    shipToPlace = 0;
}

/**
 * Begins the process of placing the selected ship onto the board. 
 */
function attemptPlacement(event){
    let clicked = getTileIndexFromClick(event);
    if(placementIndex === -1){
        if(placementMap[clicked] != 0)
            moveShip(event);
        else
            startPlacement(clicked);
    }
    else
        finishPlacement(clicked);
}

// So that instead of just setting the attribute, we can also mess with CSS or whatever
function disableReadyButton(){
    readyButton.disabled = true;
}

function enableReadyButton(){
    readyButton.disabled = false;
}

/**
 * Sends the finished placementMap to the server and starts the game
 */
function finishSetup(event){
    mainShipMap = placementMap;
    // show gameboard, hide placement
    document.getElementById("waiting").classList.remove("hide");
    // Note: These can be edited in client.
    // TODO: (As a final polish thing) Make sure the user still can't do anything with old elements if they use inspect
    // document.getElementById("gameboard").classList.remove("hide");
    document.getElementById("placement").classList.add("hide");
    socket.emit("ready", LOBBY_NAME);
    sendInitialShipMap(placementMap);
    rerender(mainShipMap, "selfMap");
}

// generate ship source
for(let i = 0; i < 25; i++) {
    let tile = createTile();
    tile.addEventListener("click", prepareShip);
    document.getElementById("shipSource").appendChild(tile);
}

// generate placement map
for(let i = 0; i < 100; i++) {
    let tile = createTile();
    tile.addEventListener("click", attemptPlacement);
    document.getElementById("placementBoard").appendChild(tile);
}

// set up ready button
readyButton.addEventListener("click", finishSetup);
disableReadyButton();

// populate ship source
// for some reason, if I try to do this before generating the placement map, the
// placement map won't show up
rerender(shipSourceMap, "shipSource");
resetActivations();