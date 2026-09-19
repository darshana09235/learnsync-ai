# LearnSync AI ??

> Turn passive YouTube watching into an interactive, retention-focused study system powered by Groq LLMs.

![LearnSync AI](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200)

## What It Does

LearnSync AI is an intelligent active-learning platform built around three core mechanics:

### 1. Focused Learning Workspace
Import any educational YouTube video or playlist into a dedicated environment that:
- Tracks your watch progress
- Maintains your daily study streak
- Stores time-stamped study notes

### 2. Grounded AI Quizzes (Active Recall)
Instead of just watching and forgetting, the system:
- Extracts the video transcript automatically
- Uses Groq's LLM pipeline (llama / gpt-oss models) to instantly generate a fact-checked, multiple-choice quiz
- Forces you to test comprehension on the **exact material** you just watched

### 3. Gap AI (Adaptive Remediation)
If you miss questions, the engine:
- Analyzes your specific failures to identify conceptual blind spots
- Automatically generates targeted, remedial video recommendations
- Bridges the exact knowledge gaps you exhibited

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 6 + TailwindCSS |
| Backend | Express.js + TypeScript (tsx) |
| Database | SQLite via better-sqlite3 |
| AI | Groq API (OpenAI-compatible SDK) |
| Transcript | youtube-transcript |

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/learnsync-ai
cd learnsync-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
OPENAI_API_KEY="your_groq_api_key_here"
APP_URL="http://localhost:3000"
```
> Get your free Groq API key at: https://console.groq.com

### 3. Run Dev Server
```bash
npm run dev
```
Open http://localhost:3000

## Deployment (Render.com)

1. Push to GitHub
2. Connect repo at https://render.com/new
3. Render auto-detects `render.yaml`
4. Add environment variable: `OPENAI_API_KEY`
5. Deploy!

## Project Structure

```
learnsync-ai/
+-- server.ts              # Express API server
+-- server/
¦   +-- aiQuestionEngine.ts  # 2-pass grounded quiz generation
¦   +-- transcriptService.ts # YouTube transcript fetching
¦   +-- db.ts               # SQLite schema & queries
+-- src/
¦   +-- App.tsx             # Main app shell
¦   +-- components/
¦   ¦   +-- YouTubePlayerWorkspace.tsx  # Core learning UI
¦   ¦   +-- ImportCourseModal.tsx       # Video import flow
¦   ¦   +-- ...
¦   +-- types.ts
+-- render.yaml            # One-click Render deployment
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ? | Your Groq API key (get free at console.groq.com) |
| `APP_URL` | Optional | Deployment URL (defaults to localhost:3000) |

## License

MIT
