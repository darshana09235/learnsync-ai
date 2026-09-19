import { BlueprintModule } from '../types';

export const BLUEPRINT_MODULES: BlueprintModule[] = [
  {
    id: 1,
    title: 'Module 1: Software Requirements Specification (SRS) & Scope (v2)',
    shortTitle: 'SRS & Scope',
    description: 'Formal problem statement, functional & non-functional requirements, literature survey, and quota math for 2-pass AI pipelines.',
    iconName: 'FileText',
    sections: [
      {
        heading: '1. Problem Statement & Strategic Vision',
        content: `YouTube is the world's largest free educational repository, with over 500 million technical and instructional videos. However, passive video consumption suffers from an 85%+ completion drop-off rate, lack of structured pedagogical assessment, zero knowledge retention mechanisms, and performance-driven content curation. 

*LearnSync AI* bridges this gap by turning passive YouTube playlists into active, gamified learning modules featuring real-time timestamped note-taking, AI-generated context quizzes, active recall metrics, and an algorithmic **AI Learning Health Score (0–100)** that dynamically adapts content recommendations based on student mastery.`
      },
      {
        heading: '2. Functional Requirements (FRs) — v2 Pipeline Specifications',
        content: `* **FR-AUTH-01:** Secure User Authentication via Firebase Auth (Google OAuth 2.0 & Email/Password JWT).
* **FR-YOUTUBE-01:** YouTube Playlist/Video URL Ingestion & Metadata Parsing via YouTube Data API v3.
* **FR-YOUTUBE-02:** Real-time Video Synchronization & Timestamp Tracking using YouTube IFrame Player API.
* **FR-NOTE-01:** Timestamp-anchored Active Recall Notes with instant timestamp jump links.
* **FR-AI-01 (Segment Classification):** Automated Gemini-based classification of video transcripts into \`INSTRUCTIONAL\`, \`LOW_SIGNAL\` (sponsors, intros), and \`TRANSITIONAL\` segments.
* **FR-AI-02 (Grounded 2-Pass Generation):** 2-pass Gemini pipeline (Generate -> Independent Verifier) that generates questions with source evidence quotes and discards hallucinations.
* **FR-AI-03:** AI Learning Health Score Matrix calculation (Quiz: 40%, Watch: 30%, Streak: 20%, Note Depth: 10%).
* **FR-AI-04:** Personalized YouTube Recommendation Query Builder targeted at identified weak skill areas.`
      },
      {
        heading: '3. Non-Functional Requirements (NFRs) & Quotas',
        content: `* **Latency SLAs:** API response time < 200ms for progress updates; Segment Classification < 1.2s; 2-Pass Quiz Generation < 2.8s.
* **Gemini API Quota Math:** For each video processed, the pipeline executes:
  - 1 Call for Segment Classification (\`gemini-3.6-flash\`).
  - 1 Call for Grounded Quiz Candidate Generation per \`INSTRUCTIONAL\` segment.
  - N Calls for Independent Fact-Checker Verification (1 per generated question).
* **Database Quotas & Latency:** 
  - **Firestore / MongoDB Atlas:** Managed cluster SLA 99.95% uptime, indexed reads < 15ms.
* **YouTube API Quota Optimization:** YouTube Data API v3 enforces a default daily quota limit of **10,000 units/day**. A single playlist details fetch costs 1 unit. Playback uses the free **YouTube IFrame Player API** (0 units).`
      },
      {
        heading: '4. Literature Survey & Competitive Matrix',
        content: `* **Coursera / Udemy:** Structured, but paywalled ($49+/mo) and static content update cycles.
* **Raw YouTube:** Free and abundant, but lacks quizzes, progress tracking, notes sync, and weak-topic detection.
* **LearnSync AI:** Free YouTube ecosystem + AI pedagogy + dynamic Health Score + grounded 2-pass quiz verification + low-signal segment skipping.`
      }
    ]
  },
  {
    id: 2,
    title: 'Module 2: System Architecture & Workflow Diagrams',
    shortTitle: 'System Architecture',
    description: 'End-to-end data flow, Mermaid sequence diagrams, use cases, and subsystem interaction blueprints.',
    iconName: 'Network',
    sections: [
      {
        heading: '1. High-Level Architecture Overview',
        content: `LearnSync AI follows a decoupled 3-tier micro-architecture:
1. **Frontend Tier (React + Vite + Tailwind + Framer Motion):** Single-page web application hosted on Vercel.
2. **Backend Services Tier (Spring Boot 3.x REST API + Express Node Proxy):** Handles JWT auth validation, YouTube API caching, and Gemini AI prompt pipelines.
3. **Data & Cloud Tier (Firebase Firestore + Auth):** Document database and authentication provider.`,
        codeBlock: {
          language: 'mermaid',
          code: `graph TD
    User([Student / Learner]) -->|HTTPS / WSS| ReactSPA[React 19 SPA - Vercel]
    ReactSPA -->|REST / Bearer JWT| SpringBoot[Spring Boot 3.x Backend]
    SpringBoot -->|Firebase Admin SDK| Firestore[(Firebase Firestore DB)]
    SpringBoot -->|WebClient| YouTubeAPI[YouTube Data API v3]
    SpringBoot -->|@google/genai SDK| GeminiAPI[Google Gemini API]
    ReactSPA -->|IFrame Events| YTPlayer[YouTube IFrame Player API]`
        }
      },
      {
        heading: '2. Sequence Diagram: Playlist Import & Ingestion',
        content: 'Step-by-step metadata extraction and database persistence.',
        codeBlock: {
          language: 'mermaid',
          code: `sequenceDiagram
    autonumber
    actor Learner
    participant React as React SPA
    participant API as Spring Boot API
    participant YT as YouTube Data API
    participant DB as Firestore DB

    Learner->>React: Paste Playlist URL (e.g. youtube.com/playlist?list=...)
    React->>API: POST /api/v1/courses/import { playlistUrl }
    API->>YT: GET /playlists?part=snippet&id=LIST_ID
    YT-->>API: Playlist Title, Thumbnail, Channel Info
    API->>YT: GET /playlistItems?part=snippet&playlistId=LIST_ID
    YT-->>API: Array of Video IDs & Titles
    API->>DB: Store Course Document & Video Nodes
    DB-->>API: Course Record Saved
    API-->>React: 201 Created { courseId, videoCount }
    React-->>Learner: Display Course in Dashboard`
        }
      },
      {
        heading: '3. Sequence Diagram: Dynamic Quiz Generation & Health Score Sync',
        content: 'Contextual quiz evaluation and real-time health score update loop.',
        codeBlock: {
          language: 'mermaid',
          code: `sequenceDiagram
    autonumber
    actor Learner
    participant React as React SPA
    participant API as Spring Boot / Node API
    participant AI as Gemini API
    participant DB as Firestore DB

    Learner->>React: Click "Generate AI Quiz" for Video
    React->>API: POST /api/v1/ai/generate-quiz { videoId, videoTitle }
    API->>AI: generateContent(Prompt + Video Subtitles/Topics)
    AI-->>API: JSON Array of MCQs + Correct Index + Topic Tags
    API-->>React: Return Quiz JSON
    Learner->>React: Submit Answers
    React->>API: POST /api/v1/ai/evaluate-quiz { userAnswers }
    API->>API: Compute Score & Extract Weak Topic Tags
    API->>DB: Update User Health Score Matrix in Firestore
    API-->>React: Return Score (85%) + New Health Score (82 - Green Zone)`
        }
      }
    ]
  },
  {
    id: 3,
    title: 'Module 3: Database Architecture (Firestore & MongoDB Mongoose)',
    shortTitle: 'Database & Security',
    description: 'Complete schemas for both Firestore & independent MongoDB Mongoose clusters, security rules, and cluster setup guide.',
    iconName: 'Database',
    sections: [
      {
        heading: '1. NoSQL Schema Specifications (Firestore + Independent MongoDB)',
        content: `LearnSync AI supports both **Firebase Firestore** and an **Independent MongoDB Atlas Cluster**. Below are the TypeScript and Mongoose Schema specifications for both database targets.`,
        codeBlock: {
          language: 'typescript',
          code: `// Independent MongoDB Schema (Mongoose Models)
import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoSegment {
  segmentId: string;
  startSeconds: number;
  endSeconds: number;
  classification: 'INSTRUCTIONAL' | 'LOW_SIGNAL' | 'TRANSITIONAL';
  confidence: number;
  reason: string;
}

export interface IGroundedQuizQuestion {
  questionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  subTopicTag: string;
  sourceEvidence: {
    startSeconds: number;
    endSeconds: number;
    excerpt: string;
  };
  verificationStatus: 'VERIFIED' | 'REJECTED';
}

const GroundedQuizSchema = new Schema({
  quizId: { type: String, required: true, unique: true },
  videoId: { type: String, required: true, index: true },
  videoTitle: { type: String, required: true },
  skippedSegments: { type: Number, default: 0 },
  questions: [{
    questionId: String,
    question: String,
    options: [String],
    correctIndex: Number,
    explanation: String,
    subTopicTag: String,
    sourceEvidence: {
      startSeconds: Number,
      endSeconds: Number,
      excerpt: String
    },
    verificationStatus: { type: String, enum: ['VERIFIED', 'REJECTED'], default: 'VERIFIED' }
  }],
  createdAt: { type: Date, default: Date.now }
});

export const GroundedQuizModel = mongoose.model('GroundedQuiz', GroundedQuizSchema);`
        }
      },
      {
        heading: '2. Database Host vs Execution Environment Context',
        content: `**Question:** Is the database independent or in your environment?
**Architectural Answer:** The database is **completely independent** of the application execution environment.
* **App Execution Environment:** Cloud Run / Docker containers running the Express Node.js & Vite backend.
* **Database Instance:** Cloud Firestore (managed by Firebase) or an independent **MongoDB Atlas M30 Cluster** hosted on AWS/GCP with dedicated TLS connection URIs (\`mongodb+srv://...\`). Database persistence survives container restarts, deployments, and redeployments.`
      },
      {
        heading: '3. Independent MongoDB Atlas Cluster Setup Guide',
        content: `To connect an independent MongoDB database:
1. Create a free/dedicated cluster on **MongoDB Atlas** (cloud.mongodb.com).
2. Create a Database User with \`readWrite\` role on the \`learnsync\` database.
3. Network Access: Add \`0.0.0.0/0\` to IP Access List for Cloud Run / Vercel container connectivity.
4. Set the environment variable in \`.env.example\`:
   \`\`\`env
   MONGODB_URI="mongodb+srv://admin:PASSWORD@cluster0.mongodb.net/learnsync?retryWrites=true&w=majority"
   \`\`\``
      }
    ]
  },
  {
    id: 4,
    title: 'Module 4: Backend REST API Blueprint & OpenAPI Spec (v2)',
    shortTitle: 'REST API Specs',
    description: 'OpenAPI 3.0 Swagger endpoints including /api/v1/ai/classify-segments and 2-pass /api/v1/ai/generate-quiz.',
    iconName: 'Server',
    sections: [
      {
        heading: '1. REST Endpoint Specifications',
        content: `* **POST /api/v1/auth/sync:** Registers or synchronizes Firebase user token.
* **POST /api/v1/courses/import:** Ingests YouTube playlist/video metadata.
* **GET /api/v1/courses/{id}/progress:** Retrieves student video watch status & timestamps.
* **POST /api/v1/ai/classify-segments:** Classifies transcript chunks into \`INSTRUCTIONAL\`, \`LOW_SIGNAL\`, or \`TRANSITIONAL\`.
* **POST /api/v1/ai/generate-quiz:** Executes 2-pass grounded generation & verification pipeline.
* **POST /api/v1/ai/evaluate-quiz:** Submits answers, updates score matrix.
* **GET /api/v1/analytics/health-score:** Calculates & returns 0-100 Health Score breakdown.`
      },
      {
        heading: '2. OpenAPI 3.0 Contract (YAML / JSON Schema)',
        content: 'Swagger spec for Segment Classification & Grounded 2-Pass Quiz Generation.',
        codeBlock: {
          language: 'json',
          code: `{
  "openapi": "3.0.3",
  "info": {
    "title": "LearnSync AI Backend API (v2)",
    "version": "2.0.0"
  },
  "paths": {
    "/api/v1/ai/classify-segments": {
      "post": {
        "summary": "Classify Transcript Segments for Low-Signal Skip",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "videoId": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Segments classified successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "videoId": { "type": "string" },
                    "segments": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "segmentId": { "type": "string" },
                          "startSeconds": { "type": "integer" },
                          "endSeconds": { "type": "integer" },
                          "classification": { "type": "string", "enum": ["INSTRUCTIONAL", "LOW_SIGNAL", "TRANSITIONAL"] },
                          "confidence": { "type": "number" },
                          "reason": { "type": "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/v1/ai/generate-quiz": {
      "post": {
        "summary": "Generate Grounded 2-Pass Fact-Checked AI Quiz",
        "responses": {
          "200": {
            "description": "Verified quiz generated",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "quizId": { "type": "string" },
                    "skippedSegments": { "type": "integer" },
                    "questions": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "question": { "type": "string" },
                          "options": { "type": "array", "items": { "type": "string" } },
                          "correctOptionIndex": { "type": "integer" },
                          "explanation": { "type": "string" },
                          "verificationStatus": { "type": "string", "example": "VERIFIED" },
                          "sourceEvidence": {
                            "type": "object",
                            "properties": {
                              "excerpt": { "type": "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
        }
      }
    ]
  },
  {
    id: 5,
    title: 'Module 5: AI Prompt Engineering & 2-Pass Pipeline Prompts (v2)',
    shortTitle: 'AI & Prompts',
    description: 'Exact Gemini system prompts for Segment Classification, Grounded Quiz Generation, and Independent Verification.',
    iconName: 'Cpu',
    sections: [
      {
        heading: '1. Segment Classifier System Prompt (Part B)',
        content: 'Categorizes video transcript chunks into INSTRUCTIONAL, LOW_SIGNAL, or TRANSITIONAL.',
        codeBlock: {
          language: 'markdown',
          code: `SYSTEM:
You are a strict content classifier for an educational video platform. You will receive a transcript segment with start/end timestamps. Classify it using ONLY the text provided — do not assume content outside this segment.

Return ONLY valid JSON, no markdown, no preamble, matching this schema:
{
  "segment_id": string,
  "start_seconds": number,
  "end_seconds": number,
  "classification": "INSTRUCTIONAL" | "LOW_SIGNAL" | "TRANSITIONAL",
  "confidence": number,       // 0.0–1.0
  "reason": string            // one sentence, plain language
}

Classification rules:
- INSTRUCTIONAL: introduces or explains a concept, technique, definition, or worked example that a learner could be quizzed on.
- LOW_SIGNAL: sponsor reads, channel intros/outros, calls to subscribe, dead air, unrelated banter, or content with insufficient information to form a factual question.
- TRANSITIONAL: restates or summarizes material already covered earlier in this same video; contains no new teachable fact.`
        }
      },
      {
        heading: '2. Grounded Quiz Generator Prompt (Pass 1) & Independent Verifier Prompt (Pass 2)',
        content: '2-Pass pipeline: Pass 1 generates questions grounded in transcript excerpts; Pass 2 fact-checks candidates against quotes.',
        codeBlock: {
          language: 'markdown',
          code: `// PASS 1: GROUNDED QUIZ GENERATOR SYSTEM PROMPT
SYSTEM:
You generate multiple-choice quiz questions strictly from the transcript segment provided. Every question MUST be answerable using only this text — never use outside knowledge, never infer beyond what is stated.

Return ONLY valid JSON, no markdown, no preamble:
{
  "questions": [
    {
      "question_id": string,
      "question": string,
      "options": [string, string, string, string],
      "correct_index": number,           // 0-3
      "explanation": string,             // why the correct answer is correct
      "sub_topic_tag": string,
      "source_evidence": {
        "start_seconds": number,
        "end_seconds": number,
        "excerpt": string                // verbatim quote, <= 40 words
      }
    }
  ]
}

// PASS 2: INDEPENDENT VERIFIER SYSTEM PROMPT
SYSTEM:
You are a fact-checker. You will receive a quiz question, its four options, a claimed correct answer, and a source excerpt. Do NOT use outside knowledge — judge only against the excerpt provided.

Return ONLY valid JSON:
{
  "question_id": string,
  "status": "VERIFIED" | "REJECTED",
  "reason": string,
  "corrected_index": number | null
}`
        }
      }
    ]
  },
  {
    id: 6,
    title: 'Module 6: Locked Frontend Data-Wiring Matrix (v2)',
    shortTitle: 'UI/UX Data Wiring',
    description: 'Field-by-field mapping matrix linking the 8 shipped React screens directly to Firestore / REST API response models.',
    iconName: 'Palette',
    sections: [
      {
        heading: '1. Screen-to-Backend Data Contract Matrix (Part A)',
        content: `Every visual element in the locked UI maps directly to an explicit API endpoint or Firestore collection field:

| Screen Name | UI Control / Element | Target Field / Endpoint Source | Behavior / Action |
| :--- | :--- | :--- | :--- |
| **01. Login / Onboarding** | Email & Google OAuth Buttons | \`POST /api/v1/auth/sync\` | Firebase Auth JWT token exchange & sync |
| **02. Dashboard Overview** | Health Score Radial Gauge (0–100) | \`UserDocument.healthScore.totalScore\` | Derived 40/30/20/10 weighted average |
| **02. Dashboard Overview** | Health Score Zone Chip (\`GREEN\`) | \`UserDocument.healthScore.zone\` | \`GREEN\` (80-100), \`YELLOW\` (50-79), \`RED\` (<50) |
| **03. Playlist Courses** | "Import YouTube Playlist" Button | \`POST /api/v1/courses/import\` | Ingests playlist ID and stores videos |
| **04. Workspace Player** | Segment Scrubber Timeline | \`POST /api/v1/ai/classify-segments\` | Highlights INSTRUCTIONAL vs LOW_SIGNAL segments |
| **04. Workspace Player** | "Skip Segment" Button | YouTube IFrame Player JS API | Seeks video player past low-signal timestamp |
| **04. Workspace Player** | "Capture Timestamp" Button | \`POST /api/v1/notes\` | Saves note tied to current video playback second |
| **04. Workspace Player** | "Generate AI Quiz" Button | \`POST /api/v1/ai/generate-quiz\` | Triggers 2-pass grounded generation pipeline |
| **04. Workspace Player** | Verified Question Excerpt Quote | \`QuizQuestion.sourceEvidence.excerpt\` | Displays verbatim transcript fact-check quote |
| **05. AI Recommendations** | "Search on YouTube" Button | \`UserDocument.weakTopics\` | Opens targeted remediation query in YouTube |
| **06. Health Analytics** | Active Recall Note Depth Metric | \`UserDocument.healthScore.noteDepth\` | Measures note count & tag coverage density |
| **07. Notes Hub** | Filter by Tag Pills | \`NoteEntry.tags\` | Client-side filter across saved note cards |
| **08. Admin Console** | System Diagnostics & Health Status | \`GET /api/v1/admin/health\` | Live server, memory, and database status check |`
      }
    ]
  },
  {
    id: 7,
    title: 'Module 7: Team Task Breakdown & SPM Execution Plan (4-Member Matrix)',
    shortTitle: 'Team & Jira Plan',
    description: 'Balanced 8-week work distribution for 4 Computer Engineering students with Jira Sprint breakdown.',
    iconName: 'Users',
    sections: [
      {
        heading: '1. Role Responsibility Matrix (4 Engineers)',
        content: `* **Member 1: Frontend Lead** (React 19, Tailwind CSS, Framer Motion, State Management, UI/UX).
* **Member 2: Backend & Security Lead** (Spring Boot 3.x, REST APIs, Firebase Auth JWT, Firestore Admin SDK).
* **Member 3: AI & Analytics Engineer** (Gemini API Integration, Prompt Engineering, Health Score Matrix, Recommendation Logic).
* **Member 4: Integration, YouTube API, Testing & DevOps** (YouTube Data & IFrame API, CI/CD GitHub Actions, Vercel/Render Deployments).`
      },
      {
        heading: '2. 8-Week Jira Sprint Breakdown',
        content: `* **Sprint 1 (Weeks 1-2) - Foundation & Auth:** Setup Monorepo, Firebase Auth, Tailwind Theme, Spring Boot base project.
* **Sprint 2 (Weeks 3-4) - YouTube Import & Player:** Integrate YouTube Data API v3, IFrame player sync, Timestamped Notes engine.
* **Sprint 3 (Weeks 5-6) - AI Quiz Engine & Health Score:** Gemini prompt pipelines, MCQ quiz modal, 0-100 Health Score matrix algorithm.
* **Sprint 4 (Weeks 7-8) - Recommendations, Testing & Defense:** AI recommendation query builder, end-to-end integration tests, Vercel/Render deployment, Viva presentation.`
      }
    ]
  },
  {
    id: 8,
    title: 'Module 8: CI/CD Pipeline & Deployment Blueprint',
    shortTitle: 'CI/CD & DevOps',
    description: 'Repository structure, GitHub Actions deploy workflow YAML, environment variables setup.',
    iconName: 'Workflow',
    sections: [
      {
        heading: '1. Production GitHub Actions Workflow (.github/workflows/deploy.yml)',
        content: 'Automated CI/CD pipeline building frontend on Vercel and backend container on Render.',
        codeBlock: {
          language: 'yaml',
          code: `name: LearnSync AI CI/CD Pipeline

on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node.js 20
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install Frontend Dependencies
        run: npm ci

      - name: Lint & Compile Applet
        run: npm run lint && npm run build

  deploy-vercel:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          alias-domains: learnsync-ai.vercel.app`
        }
      }
    ]
  },
  {
    id: 9,
    title: 'Module 9: Project Defense, Viva Preparation & Professor Q&A (v2)',
    shortTitle: 'Viva Defense Q&A',
    description: 'Top viva questions covering hallucination prevention, low-signal video handling, and independent database cluster setup.',
    iconName: 'HelpCircle',
    sections: [
      {
        heading: '1. Key Viva Defense Questions & Answers (v2 Additions)',
        content: `**Q1: How do you prevent Gemini AI from hallucinating quiz questions that aren't in the video?**
*Answer:* We implement a **2-Pass Grounded Generation & Independent Fact-Checker Pipeline**. Pass 1 requires Gemini to extract verbatim transcript excerpts (\`sourceEvidence.excerpt\`). Pass 2 passes the candidate question and excerpt to an independent Gemini verifier call. Any question marked \`REJECTED\` is discarded silently before reaching the UI.

**Q2: What happens if a video contains only sponsor reads or no instructional content?**
*Answer:* The Segment Classifier marks all segments as \`LOW_SIGNAL\`. The quiz engine detects zero \`INSTRUCTIONAL\` segments, prevents quiz generation, and displays an explicit notice: *"No quizzable instructional content detected."*

**Q3: Is your database hosted inside your container environment or independently?**
*Answer:* The database (Cloud Firestore or MongoDB Atlas) is hosted **independently** in managed cloud infrastructure. The applet container executes the Node/Vite web server, connecting to the external database via secure TLS endpoints (\`mongodb+srv://...\`). This ensures zero data loss during app redeployments.

**Q4: How do I change the GitHub account associated with my deployment repository?**
*Answer:* To switch target GitHub accounts:
1. Update git remote URL: \`git remote set-url origin https://github.com/NEW_ACCOUNT/learnsync-ai.git\`
2. Re-authenticate GitHub CLI: \`gh auth login\` or update SSH deploy keys in repository settings.
3. Update CI/CD secret tokens (\`VERCEL_TOKEN\`, \`RENDER_API_KEY\`) in the new GitHub repository settings.`
      }
    ]
  },
  {
    id: 10,
    title: 'Module 10: Future Scope & Commercialization Strategy',
    shortTitle: 'Future Scope',
    description: 'Vector database semantic search transition, B2B university licensing, freemium model, GDPR compliance.',
    iconName: 'Rocket',
    sections: [
      {
        heading: '1. Scalability Roadmap & Semantic Vector Search',
        content: `Future versions will upgrade from Firestore keyword matching to **Pgvector / Pinecone Vector Search**. Video transcripts will be converted into 768-dimensional embeddings via Gemini Embedding API, allowing semantic search across video timestamps and notes.`
      },
      {
        heading: '2. Commercialization & Business Model',
        content: `* **B2C Freemium:** Free tier offers 3 playlist imports/month. Pro ($9/mo) unlocks unlimited AI quizzes, PDF note export, and AI Health Score deep analytics.
* **B2B University & Bootcamp Licensing:** SaaS portal for university professors to curate YouTube tracks and track cohort Health Scores.`
      }
    ]
  }
];
