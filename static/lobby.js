var socket = io();
var lobby = window.location.pathname;

socket.emit("join", Number(lobby[1]))

socket.on("join", (success) => {
    if(success === 1) {
        // you have joined the room, start to check for whether the other person is in, then place ships, then run game
        console.log("heard back from join with success: " + success)
        alert("You successfully joined the room")
    }
    else {
        console.log("heard back from join with success: " + success)
        alert("The room is already full.")
        // send to an error / index page. do not actually play/send messages
    }
})