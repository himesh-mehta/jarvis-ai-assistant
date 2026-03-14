# 🤖 JARVIS — Advanced Intelligence System

JARVIS (Just A Rather Very Intelligent System) is a high-performance, futuristic AI assistant platform. It features a multi-provider "AI Race" engine, real-time memory extraction, web search, and a secure API widget system.

![JARVIS Banner](https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&q=80&w=1200)

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

### Core
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Framer Motion (for futuristic animations)

### Intelligence
- **Providers**: Groq, Google Gemini, Cohere, HuggingFace
- **Search**: Tavily AI
- **Embeddings**: HuggingFace (all-MiniLM-L6-v2)

### Backend
- **Database**: MongoDB (Atlas) + Mongoose
- **Auth**: Firebase Authentication (with Mobile Redirect Fix)
- **Server**: Firebase Admin SDK
- **Storage**: Cloudinary (Image Processing)

---

## 🚀 Getting Started

### 1. Requirements & Environment
Create a `.env.local` in the `Jarvis/` directory with the following keys:

```bash
# AI Keys
GROQ_API_KEY=your_key
GEMINI_API_KEY=your_key
COHERE_API_KEY=your_key
TAVILY_API_KEY=your_key
HUGGINGFACE_API_KEY=your_key

# Database
MONGODB_URI=your_mongodb_srv_url

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=your_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY="your_key"

# Media
CLOUDINARY_URL=your_url
```

### 2. Installation
```bash
# Install main workspace dependencies
npm install

# Run the frontend (Next.js)
cd Jarvis
npm run dev

# Run the realtime server
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

## 🛡️ Security & Privacy
- **Stateless API**: Authentication handled via Firebase ID Tokens.
- **Key Rotation**: Secure API management system included in the Settings dashboard.
- **Data Protection**: Sensitive environment variables are excluded from the repository.

Developed with ❤️ for the Next Generation of AI interfaces.
