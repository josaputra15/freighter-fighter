
lobbies = document.getElementsByClassName("lobbySelector")

for (i=0; i<lobbies.length; i++) {
    lobbies[i].addEventListener("click", () => {
        window.location = window.location + "/lobby"
    })
}