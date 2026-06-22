# Data Flow Diagram (DFD) - CodeMentor AI

This document provides a comprehensive analysis of data flow within the **CodeMentor AI** system. It details how data propagates from the user interface, through the backend servers and authentication layers, to the database and the Google Gemini AI reasoning engine.

---

## 🖼️ Architectural DFD Overview
Below is a high-level visual representation of the key system components and data pipelines in CodeMentor AI:

![CodeMentor AI Data Flow Diagram](assets/codementor_dfd.png)

---

## 1. Level 0 DFD: Context-Level Diagram
The Context Diagram represents the system boundaries and highlights the data exchanges between the external entity (User/Developer) and the CodeMentor AI system.

```mermaid
graph TD
  User([User / Developer])
  System[[CodeMentor AI System]]
  
  %% Inbound Flows
  User -- "1. Credentials / Register Request" --> System
  User -- "2. Chat Prompts / File Uploads" --> System
  User -- "3. Trigger Code Review & Audit" --> System
  User -- "4. Save Code Snippets" --> System
  
  %% Outbound Flows
  System -- "1. JWT Authentication Tokens" --> User
  System -- "2. SSE Streamed Responses (AI)" --> User
  System -- "3. Structured Audit Reports" --> User
  System -- "4. Retrieved History & Saved Snippets" --> User
```

---

## 2. Level 1 DFD: Process-Level Diagram
The Process-Level diagram decomposes the system into core components, showing how data streams between the Frontend App, FastAPI Backend, MongoDB Collections, and the Google Gemini API.

```mermaid
graph TB
  %% External Entity
  User([User / Developer])

  %% Frontend Processes
  subgraph Frontend [React Frontend Workspace]
    P1_1[1.1 Auth Manager]
    P1_2[1.2 Zustand State Store]
    P1_3[1.3 Monaco Editor Controller]
    P1_4[1.4 SSE Stream Reader]
  end

  %% Backend Processes
  subgraph Backend [FastAPI Backend Services]
    P2_1[2.1 JWT Verification Middleware]
    P2_2[2.2 Chat Route Handler]
    P2_3[2.3 AI Review Processor]
    P2_4[2.4 Snippet Controller]
  end

  %% AI Engine
  Gemini[(Google Gemini AI API)]

  %% Database Collections
  subgraph MongoDB [MongoDB Database]
    D1[(Users Collection)]
    D2[(Chats Collection)]
    D3[(Snippets Collection)]
    D4[(Reviews Collection)]
  end

  %% Data Flows - Auth
  User -- "Register / Login Credentials" --> P1_1
  P1_1 -- "POST /api/auth" --> P2_1
  P2_1 -- "Verify & Insert / Query" --> D1
  P2_1 -- "Return JWT Access Token" --> P1_1
  P1_1 -- "Save Token & Profile State" --> P1_2

  %% Data Flows - Chat Stream
  User -- "Input prompt / Attach code file" --> P1_3
  P1_3 -- "POST /api/chat/stream?prompt=..." --> P2_2
  P2_2 -- "Fetch User Profile (using token)" --> D1
  P2_2 -- "Load sliding window message history" --> D2
  P2_2 -- "Request streaming content with history context" --> Gemini
  Gemini -- "Stream back token chunks" --> P2_2
  P2_2 -- "SSE stream channel" --> P1_4
  P1_4 -- "Update Zustand & Render Monaco blocks" --> User
  P2_2 -- "Persist chat exchange (User + AI) on connection close" --> D2

  %% Data Flows - Audits & Code Quality
  User -- "Click Audit Code" --> P1_3
  P1_3 -- "POST /api/review-code" --> P2_3
  P2_3 -- "Request JSON structured format" --> Gemini
  Gemini -- "Return JSON Review Object" --> P2_3
  P2_3 -- "Save review report" --> D4
  P2_3 -- "Return code audit data (score, issues)" --> P1_3
  P1_3 -- "Inject warnings into editor panel" --> User

  %% Data Flows - Snippets
  User -- "Save Code Snippet" --> P1_3
  P1_3 -- "POST /api/snippets" --> P2_4
  P2_4 -- "Insert Snippet Metadata" --> D3
  P2_4 -- "Success response" --> P1_3
```

---

## 3. Data Dictionary (Key Flows)

| Data Flow Name | Source | Destination | Description | Key Data Fields |
| :--- | :--- | :--- | :--- | :--- |
| **Credentials** | User | 1.1 Auth Manager | Login or sign-up information submitted by the user. | `name`, `email`, `password` |
| **JWT Access Token** | 2.1 Auth Middleware | 1.2 Zustand Store | Secure token generated upon validation for stateless verification. | `access_token`, `token_type` |
| **Chat Stream Request** | 1.3 Monaco/Chat | 2.2 Chat Handler | Outbound chat trigger containing the user prompt and context identifiers. | `prompt`, `chatId`, `systemPrompt` |
| **Sliding Window History** | D2 Chats Store | 2.2 Chat Handler | Truncated collection of previous messages to prevent token context overload. | `[ { role, content, timestamp } ]` |
| **Token SSE Stream** | 2.2 Chat Handler | 1.4 SSE Reader | Event-driven chunks pushed in real-time to the frontend. | `event: message`, `data: { token }` |
| **JSON Review Report** | Gemini API | 2.3 Review Processor | Structured evaluation report returned by Gemini for code auditing. | `{ score, summary, issues: [ { type, severity, line, description } ] }` |
