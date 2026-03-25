# Volunteer & Organizer Portal for Community Bottle Drives

A full-stack web application for coordinating residential bottle drives. It provides organizers with tools to define collection zones and gives volunteers a real-time map to track pickup progress.

The goal is to eliminate overlap, improve coverage, and make progress visible across the team.

---

## Overview

This application supports community bottle drives by organizing volunteers and mapping out collection areas.

- **Organizers** can define geographic zones and manage access
- **Volunteers** can claim work and track progress live on a shared map
- **Everyone** sees real-time updates as pickups are completed

---

## Screenshots

*(forthcoming)*

- Zone drawing interface (admin)
- Volunteer map with live updates
- Approval / waiting room view

---

## Technical Stack

**Frontend**  
- React (Vite)  
- Tailwind CSS  
- Leaflet.js (mapping)

**Backend**  
- Node.js  
- Express  
- Socket.io (real-time updates)

**Database**  
- PostgreSQL  
- Prisma ORM  

**Infrastructure & Auth**  
- Docker / Docker Compose  
- Google OAuth 2.0  
- JWT-based authorization  

---

## Key Features

### Zone Management (Admin)
- **Interactive Mapping**: Draw rectangular zones on a Leaflet map  
- **Overlap Prevention**: Prevents conflicting zone definitions  
- **Address Assignment**: Automatically filters residential addresses within zone boundaries  

### Volunteer Coordination
- **Real-Time Updates**: Live pickup status via Socket.io  
- **Waiting Room**: New users require admin approval before accessing the system  
- **Role-Based Access**: Protected admin routes and actions  

### Security & Authentication
- **Google OAuth** for sign-in  
- **JWT Authorization** for API security  
- **Approval Layer**: Authentication + database-level authorization  

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- (Optional) Node.js if running outside containers

---

### Setup

1. Clone the repository  
2. Copy environment file:

```bash
cp .env.example .env
```

3. Update environment variables as needed  

### Google OAuth Setup (Required)

This application uses Google Identity Services (client-side OAuth) for authentication.

To run locally, you must create your own Google Cloud project and OAuth client:

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Configure an OAuth 2.0 Client ID (Web application)
4. Add the following:

   **Authorized JavaScript origins**
   - http://localhost:3000
   - (your production endpoint URI)

5. Add your credentials to `.env`:

```
GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_CLIENT_ID=your-client-id
```

The frontend obtains a Google ID token and sends it to the backend for verification and JWT issuance.

No redirect URIs are required for this flow.

---

### Run (Development)

```bash
docker compose -f docker-compose.dev.yml up --build
```

---

### Run (Production)

```bash
docker compose up --build
```

---

### Access

- Frontend: http://localhost:3000  
- Backend API: http://localhost:3001

*(Adjust ports if your config differs)*

---

## Status
This project is actively used for community events and is under ongoing development.

---
## Limitations
- Requires active internet connection (no offline support)
- Zone drawing limited to rectangular shapes
- No route optimization (manual coverage)

---
## Future Improvements

- Mobile UX improvements
- Route optimization / smart assignments
- Push notifications for volunteers
- Offline-first support

---
## Contributing

This project is currently tailored to a specific workflow, but contributions are welcome if they align with the goal of improving volunteer coordination and usability.

---
## License

This project is licensed under the MIT License. See the LICENSE file for details.
