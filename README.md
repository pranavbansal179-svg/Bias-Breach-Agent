# Bias Breach Agent
### Echo-Chamber Tracker — Powered by Generative + Agentic AI

Bias Breach Agent visualises how different media sources frame the same story.
It uses a multi-agent AI pipeline to score sentiment, detect political
bias, and generate plain-English echo-chamber alerts in real time.

## Tech Stack
- **Backend:** Python, FastAPI, CrewAI, LangChain
- **AI/NLP:** HuggingFace BERT, OpenAI GPT-4o
- **Memory:** Pinecone Vector DB (RAG)
- **Frontend:** Next.js, D3.js, TailwindCSS
- **Infra:** Docker, Redis, PostgreSQL, GitHub Actions

## Features
- 🤖 Multi-agent AI pipeline (Sentiment + Bias + Narrative + Echo Alert)
- 📊 Interactive 2D Sentiment Map (bias vs emotion)
- 🧠 RAG memory — ask questions about historical coverage
- ⚡ Real-time analysis via async Celery pipeline
- 🔄 Auto-refreshes every 6 hours via GitHub Actions cron

## Setup
1. Clone the repo
2. Copy `backend/.env.example` to `backend/.env` and fill in API keys
3. Run `docker-compose up -d`
4. Run `cd backend && pip install -r requirements.txt`
5. Run `uvicorn main:app --reload`
6. Run `cd frontend && npm install && npm run dev`