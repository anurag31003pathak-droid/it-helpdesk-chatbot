# Helios Enterprise IT Helpdesk Chatbot

Production-ready, full-stack IT support assistant with RAG, auto-ticketing, and an admin dashboard. Built for enterprise scale (5,000+ employees) with secure role-based access and observability.

## Architecture
- Frontend: Next.js App Router (React 18)
- Backend: FastAPI + SQLAlchemy + JWT
- Vector DB: Chroma (local); swap with Pinecone/FAISS in production
- Embeddings: Sentence Transformers
- Database: PostgreSQL (recommended) or SQLite for local dev

## Features
- RAG-only answers from company docs
- Confidence scoring to prevent hallucinations
- Multi-turn memory (conversations + message history)
- Intent detection for routing (VPN, password reset, installs, etc.)
- Auto-ticket creation on low confidence or negative feedback
- Admin dashboard with analytics and knowledge ingestion
- Role-based access (Admin vs Employee)
- Rate limiting and audit-ready logging

## Repository Layout
- `backend/` FastAPI service
- `frontend/` Next.js app
- `docs/` database schema and docs
- `sample_data/` sample KB data

## Backend Setup
```bash
cd /Users/anurag/Documents/New\ project/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Default admin user:
- Email: `admin@acme.com`
- Password: `ChangeMeNow!`

## Frontend Setup
```bash
cd /Users/anurag/Documents/New\ project/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Visit `http://localhost:3000` for the chatbot and `http://localhost:3000/admin` for the admin dashboard.

## Knowledge Ingestion
Upload docs through the admin dashboard or via API:
```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/doc.pdf" \
  http://localhost:8000/api/v1/kb/ingest
```

## API Endpoints (sample)
- `POST /api/v1/auth/login`
- `POST /api/v1/chat`
- `GET /api/v1/tickets`
- `POST /api/v1/kb/ingest` (admin)
- `GET /api/v1/analytics/summary` (admin)

## Database Schema
See `docs/schema.sql`.

## Notes
- Replace Chroma with Pinecone or FAISS in production.
- To enable OpenAI responses, set `LLM_PROVIDER=openai` and `OPENAI_API_KEY` in `backend/.env`.
- For production, configure `DATABASE_URL` for PostgreSQL and store secrets in a vault.
