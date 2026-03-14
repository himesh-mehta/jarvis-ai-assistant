# 🤖 JARVIS — Advanced Intelligence System

<div align="center">

  ![JARVIS Banner](https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&q=80&w=1200)

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

  **The next generation of AI assistance. Powerful, intelligent, and autonomous.**
</div>

---

## 📸 Interface Preview

<div align="center">
  <h3>Futuristic Chat Interface</h3>
  <img src="Jarvis/public/chat-preview.png" width="800" alt="Chat Preview" />
  <br/>
  <h3>Secure API Widget System</h3>
  <img src="Jarvis/public/widget-preview.png" width="800" alt="Widget Preview" />
</div>

---

## 🌟 Key Features

- **⚡ AI Race Engine**: Parallel execution across **Groq (Llama 3.3)**, **Gemini 2.0**, and **Cohere** to deliver the fastest and highest quality response.
- **🧠 Personal Memory Bank**: Automatically extracts and stores facts about the user to provide personalized assistance across sessions.
- **🌐 Real-time Web Search**: Integrated with **Tavily** for up-to-the-minute information on news, stocks, and current events.
- **📄 Document Intelligence**: RAG-based search for PDF, DOCX, and CSV files using **MongoDB Vector Search**.
- **🔌 Embeddable Widget**: A custom JS snippet to add JARVIS to any website with secure API key authentication.
- **🎙️ Voice & Vision**: Full support for voice interaction and image analysis.

## 🏗️ Project Structure

```text
.
├── Jarvis/             # Next.js 15 Web Application (UI, State, API Routes)
├── realtime-server/    # Node.js WebSocket Server for live interactions
├── public/             # Static assets including the embeddable widget.js
└── .gitignore          # Intelligent exclusion of sensitive and build files
```

## 🛠️ Tech Stack

### Intelligence & Search
- **Providers**: Groq, Google Gemini, Cohere, HuggingFace
- **Search Engine**: Tavily AI (Real-time data)
- **Embeddings**: HuggingFace (all-MiniLM-L6-v2) for Vector RAG

### Backend & Infrastructure
- **Database**: MongoDB Atlas + Mongoose
- **Authentication**: Firebase Auth (Optimized for Mobile/Web)
- **Storage**: Cloudinary (High-speed Image processing)
- **Realtime**: Node.js + WebSockets

---

## 🚀 Getting Started

### 1. Requirements & Environment
Create a `.env.local` in the `Jarvis/` directory with your API keys.

### 2. Installation & Development

```bash
# Install dependencies
npm install

# Start the JARVIS Frontend (Next.js)
cd Jarvis
npm run dev

# Start the Realtime Server
cd ../realtime-server
node server.js
```

## 🔌 Using the Widget
To embed JARVIS on your own site, use the following snippet:

```html
<script 
  src="https://your-domain.com/widget.js" 
  data-key="your-api-key"
  data-name="JARVIS"
  data-color="#00D2FF">
</script>
```

---

## 🛡️ Security
- **Stateless API**: Authentication handled via Firebase JWT.
- **Key Security**: Automated key rotation and encryption for the widget system.
- **Privacy**: Localized data exclusion via `.gitignore` to prevent secret leaks.

<div align="center">
  Developed with ❤️ for the Next Generation of AI interfaces.
</div>
