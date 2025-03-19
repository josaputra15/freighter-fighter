
// open our socket connection to the server
var socket = io();

lobbies = document.getElementsByClassName("lobbySelector");

// add listener for each button that checks whether the lobby is open. if it is, launches socket.on(exists) which changes to that page
for (let i=0; i < lobbies.length; i++) {
    lobbies[i].addEventListener("click", () => {
        console.log(i);
        socket.emit('exists', i);
    })
}


socket.on('exists', (num, available) => {
    // if the room is available, connect to that room
    if(available === 1) {
        socket.emit('join', num);
        window.location = window.location + num;
    }
    else {
        alert("that room is not available");
    }
})
