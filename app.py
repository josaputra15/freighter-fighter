from flask import Flask, render_template, request

app = Flask(__name__)

@app.get("/")
def index():
    return render_template("index.html")

@app.get("/lobby")
def lobby():
    return render_template("lobby.html", lobbyNum="example", userNum="example")