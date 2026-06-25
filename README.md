# CodeMentor AI - Premium AI-Powered Software Engineering Workspace

CodeMentor AI is a full-stack, state-of-the-art AI Coding Assistant designed to enhance the developer experience. Inspired by premium products like Cursor, ChatGPT, and Linear, CodeMentor AI integrates a ChatGPT-style conversation workspace with an embedded Monaco Code Editor, supporting real-time code generation, line-by-line explanation, static code auditing, performant optimization, automatic documentation, and educational programming walk-throughs.

This project is built using modern cloud-native architectures, suitable as a **Summer-Intern Project** and for **Software Engineering Placement** showcases.

---

## 🚀 Core Architectural Features

1. **ChatGPT-Style Chat Workspace**: Streaming multi-turn conversation with automatic syntax highlighting, markdown renderings, message timestamps, regeneration, and active text generation cancellations.
2. **Integrated Monaco Code Editor**: Side-by-side collapsible and resizable code canvas panel powered by Monaco Editor (the core engine of VS Code), with custom formatting and syntax highlighting.
3. **Audit and Load Bindings**: A "wow" placement feature that maps chatbot code blocks directly to Monaco Editor controls. One-click lets developers "Load into Editor" or execute an "Audit" on code quality.
4. **Token Context sliding window**: Client-side character truncation for massive files combined with backend sliding-window history buffers to prevent Gemini context size failures.
5. **Real-time SSE Streaming**: Token-by-token server-sent event (SSE) generation using FastAPI's EventSourceResponse, saving the full exchange to MongoDB only after stream completion.
6. **Robust Code Review Audit**: Evaluates code quality, syntax correctness, code smells, duplicate lines, and severity levels, returning structured JSON reports.

---

## 🛠️ Technology Stack

### Frontend
- **React.js & TypeScript**: Type-safe component architecture.
- **Tailwind CSS**: Custom developer theme variables, gradients, and layout controls.
- **Zustand**: Minimalist, fast, and optimized client state management (Auth, Chat, Editor, UI).
- **Framer Motion**: Page transitions and element layouts animations.
- **Monaco Editor (`@monaco-editor/react`)**: Lightweight browser IDE.
- **React Markdown & Remark GFM**: Markdown reader with custom code block overrides.
- **Axios**: API integration with JWT auto-inject request interceptors.

### Backend
- **FastAPI (Python)**: High-performance ASGI framework.
- **Motor**: Asynchronous MongoDB client for non-blocking I/O.
- **Google Gemini API**: Principal AI reasoning engine for programming tasks.
- **JWT (python-jose & passlib)**: Password hashing with bcrypt and secure route authentication.
- **sse-starlette**: Native Server-Sent Event (SSE) generators.

---

## 📁 Database Schema Collections (MongoDB Async)

- **Users (`users`)**:
  - `_id` (ObjectId)
  - `name` (String)
  - `email` (String - Unique)
  - `password` (Hashed via bcrypt)
  - `createdAt` (ISODate)

- **Chats (`chats`)**:
  - `_id` (ObjectId)
  - `userId` (String ref)
  - `title` (String)
  - `isPinned` (Boolean)
  - `messages` (Array: `{ role, content, timestamp, intent, language }`)
  - `createdAt` (ISODate)

- **CodeSnippets (`snippets`)**:
  - `_id` (ObjectId)
  - `userId` (String ref)
  - `title` (String)
  - `language` (String)
  - `code` (String)
  - `createdAt` (ISODate)

- **Reviews (`reviews`)**:
  - `_id` (ObjectId)
  - `userId` (String ref)
  - `code` (String)
  - `language` (String)
  - `report` (Object: `{ score, summary, issues: [{ type, severity, line, description }], suggestions }`)
  - `createdAt` (ISODate)

---

## 🔌 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create user account & return token.
- `POST /api/auth/login` - Validate credentials & return token.

### Chat Management
- `POST /api/chat/stream` - Initiates multi-turn SSE chat stream.
- `GET /api/chat/history` - Retrieve previous chat cards sorted by pin status.
- `GET /api/chat/:id` - Fetch message exchange detail.
- `PUT /api/chat/:id` - Pin, unpin, or rename chat.
- `DELETE /api/chat/:id` - Remove chat from history.

### AI Tasks (Streaming)
- `POST /api/generate-code` - Prompt to source code generator.
- `POST /api/explain-code` - Pasted code logic builder.
- `POST /api/debug-code` - Logical and syntax debugger.
- `POST /api/optimize-code` - Code efficiency formatter.
- `POST /api/generate-docs` - Docstrings and README builder.

### AI Review (JSON Structured)
- `POST /api/review-code` - Returns code smells audit JSON.
- `GET /api/reviews` - Review history lookup.

### Snippets CRUD
- `POST /api/snippets` - Save snippet manually.
- `GET /api/snippets` - Retrieve saved snippets cards.
- `PUT /api/snippets/:id` - Edit saved snippet details.
- `DELETE /api/snippets/:id` - Delete snippet.

### Profile
- `GET /api/profile` - Current user details.
- `PUT /api/profile` - Change name, email, or password.

---

## 📊 Data Flow Diagrams (DFD)

Refer to the [DFD.md](DFD.md) documentation for a detailed overview of the system architecture, context diagrams, and level-1 process diagrams explaining the flow of data across the components.

---

## 🔧 Installation & Usage

Refer to [setup_instructions.md](setup_instructions.md) for detailed step-by-step local configuration guidelines and environment configs.

