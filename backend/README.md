# SickSense Backend

## Setup & Installation

### 1. Install Dependencies
Make sure you have your Python environment activated, then install the required packages:
```bash
pip install -r requirements.txt
```

### 2. Environment Variables (`.env`)
You must create a `.env` file inside the `backend/` directory. It should contain your API keys and configuration settings. Here is an example of what it needs to look like:

```ini
# Core Google/Gemini APIs
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Agent Server Ports
SCOUT_PORT=8001
ANALYST_PORT=8002
ADVISOR_PORT=8003
API_PORT=8000
```

### 3. Firebase Service Account Key
To verify authentication tokens, you need the **Firebase Admin SDK Service Account JSON**. 
1. Download this file securely from the **Service Accounts** tab in your Firebase Console project settings.
2. Rename the downloaded file to `ServiceAccountKey.json`.
3. Place `ServiceAccountKey.json` directly into this `backend/` folder. 

*(Note: `ServiceAccountKey.json` is safely added to `.gitignore`, so it will not be committed to GitHub.)*

## Running the Application

To spin up the main SickSense API server along with all of its underlying agent servers (Scout, Analyst, Advisor), run the orchestration script using Python 3:

```bash
python3 run.py
```

Once running, the central API server will be available at `http://localhost:8000`. 
Orchestration agents will quietly bind to ports `8001`, `8002`, and `8003` in the background.

## ADK Dev UI (Agent Dashboard)

The Google ADK includes a built-in web dashboard for inspecting agent traces, events, and state. To use it, you need a separate `.env` file inside `backend/agents/`:

### 1. Create `backend/agents/.env`

```ini
GOOGLE_API_KEY=your_gemini_api_key_here
```

> **Note:** This file uses your **Gemini API key** (not the Google Maps key). This is needed because the ADK Dev UI reads `GOOGLE_API_KEY` directly for LLM calls, while `run.py` handles the key swap automatically.

### 2. Launch the Dev UI

From the **project root** (`sick_sense_pre`):

```bash
PYTHONPATH=. adk web --port 8888 backend/agents
```

Then open `http://127.0.0.1:8888` in your browser. You can select any agent (Scout, Analyst, Advisor) from the dropdown and interact with it individually, viewing full traces of parallel execution, tool calls, and self-correction loops.

*(Note: `backend/agents/.env` is safely added to `.gitignore`.)*
