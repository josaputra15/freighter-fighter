from flask import Flask

def create_app():
    application = Flask(__name__)
    # app.config.from_pyfile(config_filename)

    from .app import socketio
    socketio.init_app(application)

    # Register web application routes
    from .main import main
    application.register_blueprint(main)

    return application
