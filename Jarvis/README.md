# JARVIS

AI chatbot with multiple features. Built with Next.js and integrated with various AI and file processing capabilities.

## Tech Stack & Dependencies

### Core Frameworks
- **Next.js**: 16.1.6
- **React**: 19.2.3
- **TypeScript**: ^5

### AI & LLM Integration
- **LangChain**: ^1.2.30
- **LangChain Community**: ^1.1.22
- **LangChain Core**: ^1.1.31
- **LangChain Groq**: ^1.1.4
- **LangChain MongoDB**: ^1.1.0
- **Groq SDK**: ^0.37.0
- **Tavily Core**: ^0.7.2

### Backend & Database
- **Mongoose**: ^9.2.4
- **Firebase**: ^12.10.0
- **Firebase Admin**: ^13.7.0
- **Multer**: ^2.1.1
- **Cloudinary**: ^2.9.0

### UI & UX
- **Framer Motion**: ^12.34.4
- **Lucide React**: ^0.576.0
- **Radix UI**: ^1.4.3
- **Shadcn UI**: ^3.8.5
- **Tailwind CSS**: ^4
- **Canvas Confetti**: ^1.9.4
- **Recharts**: ^3.7.0

### Utils
- **Markdown Processing**: `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js`
- **File Processing**: `mammoth` (Docx), `pdf-parse`, `xlsx`, `csv-parser`
- **Styling Utils**: `clsx`, `tailwind-merge`, `class-variance-authority`

## Key Module Implementation

### 1. AI & LLM (Groq & LangChain)
Used for high-speed inference and orchestrating AI workflows.

```typescript
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "llama-3.3-70b-versatile",
});
```

### 2. Backend & Auth (Firebase)
Handles user authentication and secure profile management.

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
```

### 3. Database (Mongoose)
Direct integration for persistent chat history and user memory.

```typescript
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);

const ChatSchema = new mongoose.Schema({
  sessionId: String,
  messages: Array,
  timestamp: { type: Date, default: Date.now }
});
```

### 4. Animations (Framer Motion)
Powers smooth transitions and the chat activity indicator.

```tsx
import { motion } from "framer-motion";

<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  Futuristic JARVIS UI 
</motion.div>
```

### 5. Media & Files (Cloudinary & Multer)
Handles image uploads and document (PDF/Docx) parsing.

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY 
});
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.