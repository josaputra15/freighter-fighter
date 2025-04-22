//////////////////////////////////////////
//      GLOBALS DEFINITIONS
//////////////////////////////////////////

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



//////////////////////////////////////////
//      FUNCTION DEFINITIONS
//////////////////////////////////////////


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
 * Returns false if not activated, true if activated
 */
function tryReadyButton(){
    for(ship of shipSourceMap){
        if(ship !== 0)
            return false;
    }

    enableReadyButton();
    return true;
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
 * 
 * THIS IS THE PART THAT INTERACTS WITH OTHER PARTS OF THE LOBBY/GAME
 */
function finishSetup(event){
    mainShipMap = placementMap;
    // show gameboard, hide placement
    document.getElementById("waiting2").classList.remove("hide");
    // Note: These can be edited in client.
    // TODO: (As a final polish thing) Make sure the user still can't do anything with old elements if they use inspect
    // document.getElementById("gameboard").classList.remove("hide");
    document.getElementById("placement").classList.add("hide");
    socket.emit("ready", LOBBY_NAME);
    sendInitialShipMap(placementMap);
    rerender(mainShipMap, "selfMap");
}



//////////////////////////////////////////////////////////////////
//      CODE THAT ACTUALLY RUNS WHEN WE LOAD THIS FILE
//////////////////////////////////////////////////////////////////

// set up ready button
readyButton.addEventListener("click", finishSetup);
disableReadyButton();

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

// populate ship source
// for some reason, if I try to do this before generating the placement map, the
// placement map won't show up
rerender(shipSourceMap, "shipSource");
resetActivations();