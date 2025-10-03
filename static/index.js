
// open our socket connection to the server
var socket = io();

const NUM_LOBBIES = document.getElementById("lobbyNum").getAttribute("content");
let lobbies = document.getElementById("lobbies");

// create a lobby for our total number of lobbies
for (let i=0; i < NUM_LOBBIES; i++) {
    lobbies.appendChild(createButton(i+1))
    console.log("created button");
}

// responds to a exists message, which changes you to that page if it's available
socket.on('exists', (num, available) => {
    // if the room is available, connect to that room
    if(available === 1) {
        window.location = window.location + "lobby/" + num;
    }
    else {
        alert("that room is not available");
    }
})

// add listener for each button that checks whether the lobby is open. if it is, launches socket.on(exists) which changes to that page
// also creates the element for the button
function createButton(number) {
    let button = document.createElement("button");
    button.className = "lobbySelector";
    button.id = number;
    button.innerText = "Join Lobby "+number;

    button.addEventListener("click", () => {
        console.log(number);
        socket.emit('exists', number);
    })
    return button;
}
