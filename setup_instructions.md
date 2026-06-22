# Setup & Running Instructions - CodeMentor AI

This document provides step-by-step instructions on setting up, configuring, running locally, and deploying the **CodeMentor AI** full-stack application.

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) and `npm`
- **Python** (v3.10 or higher) and `pip`
- **MongoDB** (A local MongoDB instance running on `mongodb://localhost:27017` OR a MongoDB Atlas cloud connection URI)
- **Google Gemini API Key** (Obtained from [Google AI Studio](https://aistudio.google.com/))

---

## 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS/Linux Terminal
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your Environment Variables:
   - A `.env` file has been pre-created in the `backend/` directory.
   - Open `backend/.env` and update the `GEMINI_API_KEY` with your official key:
     ```env
     GEMINI_API_KEY=AIzaSy...YourActualGeminiKeyHere...
     ```
   - (Optional) Modify the `MONGODB_URI` if using MongoDB Atlas, or keep the default for local database testing.

5. Start the FastAPI development server:
   ```bash
   # Make sure you are in the backend directory with active virtual environment
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - The backend API will now be running on `http://127.0.0.1:8000`.
   - Access the interactive documentation (Swagger) at `http://127.0.0.1:8000/docs`.

---

## 2. Frontend Setup (Vite + React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the frontend packages:
   ```bash
   npm install
   ```

3. Configure your Environment Variables:
   - Verify that the `frontend/.env` file exists and matches:
     ```env
     VITE_API_URL=http://localhost:8000
     ```

4. Launch the local dev server:
   ```bash
   npm run dev
   ```
   - The React-TS client application will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 3. Production Deployment Guidelines

The codebase is engineered to be lightweight, modular, and cloud-ready, conforming to placement interview expectations.

### Frontend Deployment (Vercel)

1. Install Vercel CLI or log in to the Vercel dashboard.
2. Select **Add New Project** and link the `frontend` subfolder.
3. Configure the **Build Commands**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Define the Environment Variable in Vercel settings:
   - `VITE_API_URL` = (Set this to your deployed FastAPI backend URL, e.g., `https://codementor-api.onrender.com`)
5. Click **Deploy**.

### Backend Deployment (Render or Railway)

1. Log in to Render/Railway.
2. Select **New Web Service** and connect your repository.
3. Configure settings:
   - Runtime: `Python 3`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Input Environment Variables in the service panel:
   - `MONGODB_URI` = (Your MongoDB Atlas connection string)
   - `GEMINI_API_KEY` = (Your Google Gemini key)
   - `JWT_SECRET_KEY` = (A secure random 32-character hex code)
   - `FRONTEND_URL` = (Your deployed Vercel URL, e.g., `https://codementor-ai.vercel.app`)
5. Click **Deploy**.
