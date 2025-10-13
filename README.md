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

## Google Cloud Platform Deployment

This section documents the process of deploying Freighter Fighter to Google Cloud Run, including the challenges encountered and lessons learned.

### Deployment Process

The deployment was accomplished through the following steps:

#### 1. **Prerequisites Setup**
- Installed and authenticated Google Cloud CLI
- Enabled required APIs: Cloud Build, Cloud Run, and Container Registry
- Set up project configuration (`mailswiper-backend-demo`)

#### 2. **Docker Configuration**
- Created `wsgi.py` entry point for production deployment
- Updated `Dockerfile` with proper configuration for Cloud Run
- Configured environment variables (`FLASK_ENV=production`, `PORT=8080`)
- Added timeout settings for WebSocket connections

#### 3. **Build and Deploy**
```bash
# Build and push Docker image using Cloud Build
gcloud builds submit --tag gcr.io/freighter-fighter/freighter-fighter . --project=freighter-fighter

# Deploy to Cloud Run
gcloud run deploy freighter-fighter --image gcr.io/freighter-fighter/freighter-fighter --region us-central1 --project=freighter-fighter
```

#### 4. **Live Application**
- **URL**: https://freighter-fighter-343247389048.us-central1.run.app
- **Status**: Successfully deployed and operational
- **Features**: All multiplayer functionality working with WebSocket support


#### 5. **Monitor Logs**
```bash
gcloud run services logs tail battleship-game --region us-central1
```


### Challenges Encountered

#### 1. **Missing WSGI Entry Point**
- **Problem**: Original deployment configs referenced `wsgi.py` which was deleted
- **Solution**: Created new `wsgi.py` file with proper Flask-SocketIO configuration
- **Lesson**: Always maintain deployment entry points when refactoring

#### 2. **WebSocket Support Configuration**
- **Problem**: Ensuring WebSocket connections work properly in production
- **Solution**: Used Eventlet worker class with Gunicorn and proper timeout settings
- **Lesson**: WebSocket applications require specific server configurations

#### 3. **Docker Image Optimization**
- **Problem**: Initial builds were slow and inefficient
- **Solution**: Used Google Cloud Build for faster, more reliable builds
- **Lesson**: Cloud-native build services often outperform local Docker builds

#### 4. **Memory and Resource Allocation**
- **Problem**: Determining appropriate resource limits for the application
- **Solution**: Started with 1Gi memory and 1 CPU, monitoring performance
- **Lesson**: Start conservative and scale based on actual usage patterns

### Pros and Cons

#### **Pros of Google Cloud Run Deployment**

 **Serverless Architecture**
- No server management required
- Automatic scaling based on traffic
- Pay only for actual usage

 **Easy Deployment**
- Simple Docker-based deployment
- Integrated with Google Cloud ecosystem
- Excellent CLI tooling

 **WebSocket Support**
- Native support for WebSocket connections
- Perfect for real-time multiplayer games
- No additional configuration needed

 **Cost Effective**
- Generous free tier (2M requests/month)
- No idle costs when not in use
- Predictable pricing model

 **Global Availability**
- Automatic HTTPS with custom domains
- Global CDN integration
- Low latency worldwide

#### **Cons of Google Cloud Run Deployment**

 **Cold Start Latency**
- First request after inactivity can be slow
- May affect user experience for infrequent users
- Can be mitigated with minimum instances

 **Request Timeout Limits**
- Maximum 60 minutes per request
- May not be suitable for very long-running processes
- WebSocket connections count as long-running requests

 **Vendor Lock-in**
- Tied to Google Cloud ecosystem
- Migration to other platforms requires reconfiguration
- Learning curve for Google Cloud services

 **Resource Constraints**
- Limited to 8GB RAM and 4 CPUs per instance
- May not scale for extremely high-traffic applications
- Memory limits can affect database operations

 **Debugging Complexity**
- Serverless debugging can be more challenging
- Logs are distributed and time-limited
- Less control over the underlying infrastructure

### Alternative Deployment Options

For comparison, other viable deployment options include:

- **Railway**: Simpler setup, good for beginners
- **Heroku**: Traditional PaaS, easy deployment
- **DigitalOcean App Platform**: Middle ground between simplicity and control
- **AWS ECS/Fargate**: More complex but highly scalable
- **Self-hosted VPS**: Maximum control but requires server management

### Recommendations

For this Battleship game project, Google Cloud Run is an excellent choice because:

1. **Real-time Requirements**: WebSocket support is crucial for multiplayer gameplay
2. **Traffic Patterns**: Games have variable traffic, perfect for serverless scaling
3. **Cost Efficiency**: Free tier covers development and moderate usage
4. **Ease of Use**: Simple deployment process suitable for academic projects
5. **Future Scalability**: Can easily handle growth in user base





The deployment successfully demonstrates modern cloud-native application deployment practices while maintaining the real-time multiplayer functionality essential to the game's core experience.


### Primary Sources:

Eby, P. J., et al. (2010). PEP 3333: Python Web Server Gateway Interface v1.0.1. Python Software Foundation. https://peps.python.org/pep-3333/
Fette, I., & Melnikov, A. (2011). RFC 6455: The WebSocket Protocol. Internet Engineering Task Force. https://tools.ietf.org/html/rfc6455
Grinberg, M. (2023). Flask-SocketIO Documentation. https://flask-socketio.readthedocs.io/en/latest/
Google Cloud (2023). Cloud Run Documentation: Deploying containerized services. https://cloud.google.com/run/docs/deploying
Docker Inc. (2023). Dockerfile Reference: Best practices for writing Dockerfiles. https://docs.docker.com/develop/dev-best-practices/dockerfile_best-practices/