# Rapid Response Medical Crisis Project
📌 About

Rapid Response is a web-based medical emergency response platform designed to connect people in need with immediate assistance during health crises. The platform allows users to register and log in securely, report medical emergencies, share their live location, view nearby hospitals on an interactive map, and use voice commands for faster emergency reporting. Its goal is to reduce response time and improve coordination during critical situations.

🚀 Features

   🔐 Secure User Registration & Login
   
   🏥 Medical Emergency Reporting
   
   📍 Live Location Tracking 
   
   🎤 Voice-Based Emergency Reporting
   
   🚑 Nearby Hospitals & Emergency Services
   
   👤 User Dashboard
   
   💾 Database Storage (MySQL)
   
   ☕ Java Spring Boot Backend
   
   🌐 Responsive Frontend
   
## Run

Install Java 17 and Maven, then run:

```powershell
mvn spring-boot:run
```

Open:

```text
http://localhost:8080
```

## Deploy on Render

This project can be deployed to Render as a Docker-based web service.

1. Push this repository to GitHub.
2. In Render, create a new `Web Service`.
3. Connect the GitHub repository.
4. Render will detect the `Dockerfile` and build the app automatically.
5. Deploy the service and open the generated `onrender.com` URL.

The app now reads the `PORT` environment variable automatically, which Render provides during deployment.

Note: the current H2 file database is fine for demos, but Render's default filesystem is ephemeral. For persistent production data, move to a managed database such as PostgreSQL.

The local database is saved in:

```text
data/rapid_response_db.mv.db
```

H2 database console:

```text
http://localhost:8080/h2-console
```

Use these settings:

- JDBC URL: `jdbc:h2:file:./data/rapid_response_db`
- User Name: `sa`
- Password: leave empty

## How Live Maps Work

The frontend uses Leaflet with OpenStreetMap tiles. It asks the browser for live GPS using `navigator.geolocation.watchPosition`. The user can click the map or type destination latitude and longitude. The app draws a line between source and destination and calculates remaining distance with the Haversine formula.

For real road routes like Google Maps, replace the straight-line calculation with a routing API:

- Google Maps Directions API
- Mapbox Directions API
- OpenRouteService

## How AI Chatbox Works

This project includes a safe demo chatbot in Java at `/api/chat`. It gives rule-based first-aid guidance for common crisis keywords.

For a real AI chatbot, keep the frontend the same and update `ChatController.java` to call an AI API from the backend. Do not put API keys in frontend JavaScript.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/crisis/report`
- `GET /api/crisis/reports/{userId}`
- `POST /api/chat`
