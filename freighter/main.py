from flask import Blueprint, redirect, render_template, request
from .app import NUM_LOBBIES

#==============================
# Basic Routing
#==============================

main = Blueprint('main', __name__)


@main.errorhandler(404)
def not_found(e):
    return render_template("404.html")

# serve our index.html page when you go to the root page
@main.get("/")
def index():
    return render_template("index.html", numLobbies = NUM_LOBBIES)

@main.get("/rules")
def rules():
    return render_template("rules.html")

# serve our lobby.html page when you go to any other page. uses the passed lobby (second part of URL) as part of the template
@main.get("/lobby/<int:lobby>")
def lobby(lobby: str):
    try:
        lobby_int = int(lobby)

        if lobby_int <= 0 or lobby_int > NUM_LOBBIES:
            raise ValueError

        return render_template("lobby.html", lobbyName=lobby_int)
    except ValueError:
        return redirect("/")
