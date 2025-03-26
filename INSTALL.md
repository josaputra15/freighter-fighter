Ensure you've selected the venv in this folder for your Python's interpreter, or created a venv in the folder
- the version i'm using is Python 3.13.1
- also I think the venv isn't part of the Github repo, so you'll need to create it

Ensure that the venv has already installed Flask 
- 'pip list' should show all packages. make sure Flask is in there
- if it's not, do 'pip install Flask'

Ensure that the venv has installed SocketIO for Flask
- 'pip list' again
- if it's not there, 'pip install flask_socketio'


to run do flask --app app run



requirements.txt
-----------------
Flask
flask_socketio