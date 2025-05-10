# Freighter Fighter 

<img src="static/assets/5long.svg" alt="logo" border="0" align="center" width="100"/>

Freighter Fighter is a web-based multiplayer Battleship client. Players can play in one of nine lobbies against the other player in the lobby. It supports both keyboard and mouse controls, and keeps track of lifetime site stats for those who are interested.


## How to Install

1. Clone the repository to a new location. 

2. (Recommended) Create a Python virtual environment in the directory.

3. In a command prompt within the repo, run this command to download the required Python packages:
```
pip install -r requirements.txt
```

4. Run the following command within the main directory:
```
flask run
```

5. Enjoy the website at **127.0.0.1:5000**

6. If you'd like to host to other people on your network, find your IPv4 address using 'ipconfig' in your terminal, then run the app with that as an extra parameter:
```
flask run -h 10.1.10.174  <- replace with your IPv4 address
```

## Project Details

This project was created as part of a group project between [Gavin Davis](https://github.com/ZermbaGerd) and [Ruben Escobar](https://github.com/RubenEscobar14) in an Internet Computing (COMP446) class at Macalester College. Development happened March 13th - June 9th in 2025.

The project uses Flask for the back-end, and most client-server communication happens through SocketIO, implemented using Flask-SocketIO. The front-end is vanilla HTML, CSS, and JS.

## Notes

This project lives [on GitHub](https://github.com/ZermbaGerd/comp446-battleship) and might not render correctly on third-party websites.