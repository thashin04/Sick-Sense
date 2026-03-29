<p align="center">
  <img src="src/assets/landing-graphic.png" width="300" alt="Sick-Sense Logo">
</p>

<h1 align="center">Sick-Sense</h1>
<p align="center"><strong>Real-time Health Outbreak Detection & Monitoring</strong></p>

---

Sick-Sense is a cutting-edge health monitoring platform designed to detect and visualize sickness clusters in real-time. By leveraging a multi-agent AI architecture and localized data collection, Sick-Sense provides users with timely alerts, visual heatmaps, and personalized health briefings to stay ahead of potential outbreaks.

## Key Features

-   ** Real-time Outbreak Heatmaps**: Interactive Mapbox-powered visualization showing sickness clusters and trends in your vicinity.
-   ** AI-Powered Daily Briefings**: Automated, personalized daily health reports using Text-to-Speech (TTS) to keep you informed on the go.
-   ** Multi-Agent AI Architecture**: 
    -   **Scout**: Collects and crawls health-related data from various sources.
    -   **Analyst**: Processes and identifies patterns in sickness reports.
    -   **Advisor**: Generates actionable advice and briefings for users.
-   ** In-Network Provider Search**: Seamlessly find healthcare providers and facilities that accept your insurance (including Florida Blue).
-   ** Localized Insights**: Targeted health data specific to your city and neighborhood.

## Tech Stack

### Frontend
-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Mapping**: [@rnmapbox/maps](https://github.com/rnmapbox/maps)
-   **Language**: TypeScript
-   **Internationalization**: i18next
-   **Styling**: Custom Theme System (Vanilla CSS based)

### Backend
-   **Language**: Python 3.10+
-   **AI Framework**: [Google ADK](https://github.com/google/attentional-diffusion) (Agent Development Kit) with [Gemini Pro](https://deepmind.google/technologies/gemini/)
-   **Database**: Firebase Firestore
-   **Authentication**: Firebase Auth
-   **Orchestration**: Custom Agentic Pipeline (Scout, Analyst, Advisor)

## Project Structure

```text
├── backend/            # Python backend services and AI agents
│   ├── agents/         # Scout, Analyst, and Advisor agent definitions
│   ├── api.py          # Central API server
│   ├── run.py          # Orchestration script to start all services
│   └── scrapers/       # Data collection scripts
├── src/                # React Native Expo frontend
│   ├── assets/         # Images, fonts, and static resources
│   ├── components/     # Reusable UI components
│   ├── navigation/     # App navigation logic
│   └── screens/        # Main application screens (Map, Dashboard, Advice, etc.)
└── App.tsx             # Frontend entry point
```

## Getting Started

### Backend Setup
1.  Navigate to the `/backend` directory.
2.  Install dependencies: `pip install -r requirements.txt`.
3.  Configure your credentials in a `.env` file (see `backend/README.md` for details).
4.  Add your `ServiceAccountKey.json` for Firebase.
5.  Run the system: `python run.py`.

### Frontend Setup
1.  From the project root, install dependencies: `npm install`.
2.  Start the Expo development server: `npx expo start`.
3.  Follow the instructions in the terminal to launch the app on your device or emulator.