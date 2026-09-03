
# SkillBridge AI v4 - SIH Demo MVP

**Portal for Academia - Industry collaboration for Skill Mapping, Internships and Placement**

## What is new in v3?
- Role Based Access Control: Student, Industry, Faculty, Institution
- Student AI skill-gap and opportunity matching
- Industry AI candidate ranking
- Industry internship/job publishing
- Faculty FDP, faculty internship, research and mentorship program management
- Institution analytics for student readiness, department distribution and industry skill demand
- Institution event management
- MySQL persistence + JWT authentication
- FastAPI AI service with interpretable matching logic
- Responsive React dashboard

## Demo accounts
Password for all demo accounts: `demo`
- Student: demo@student.com
- Industry: industry@insightlabs.com
- Faculty: faculty@skillbridge.edu
- Institution: institution@skillbridge.edu

## Run
1. Create MySQL database by importing `database/schema.sql`.
2. Backend:
   `cd backend`
   copy `.env.example` to `.env`, set DB credentials
   `npm install`
   `npm run dev`
3. AI service:
   `cd ai-service`
   `python -m venv venv`
   activate it
   `pip install -r requirements.txt`
   `uvicorn app:app --reload --port 8000`
4. Frontend:
   `cd frontend`
   `npm install`
   `npm run dev`

URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- AI service: http://localhost:8000

## SIH demo flow
Student -> Assessment -> Skill Gap -> AI Match -> Apply -> Industry Candidate Ranking
Faculty -> Publish FDP/Research/Mentorship -> Institution sees skill demand and readiness
Institution -> Analytics -> Events/Training -> improve student readiness


## v4 SIH upgrades
- SIH-focused hero experience and closed-loop product story
- Judge demo flow document
- Career Gap Simulator design and API roadmap
- Resume/certificate/mentorship/notification production roadmap
- Production security checklist
