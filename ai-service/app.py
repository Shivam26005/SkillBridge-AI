from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import numpy as np

app = FastAPI(title="SkillBridge AI - Recommendation Engine")

# Enable CORS for Express and Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StudentSkill(BaseModel):
    name: str
    proficiency: float

class JobRequirement(BaseModel):
    skill: str
    required_level: float

class MatchRequest(BaseModel):
    student_skills: List[StudentSkill]
    job_requirements: List[JobRequirement]

@app.post("/api/ai/match")
def calculate_match(data: MatchRequest):
    student_map = {s.name.lower(): s.proficiency for s.student_skills in [data.student_skills] for s in student_skills}
    
    total_weight = 0
    acquired_weight = 0
    roadmaps = []

    for req in data.job_requirements:
        skill_key = req.skill.lower()
        req_level = req.required_level
        total_weight += req_level
        
        current_level = student_map.get(skill_key, 0)
        acquired_weight += min(current_level, req_level)
        
        gap = max(0, req_level - current_level)
        if gap > 0:
            roadmaps.append({
                "skill": req.skill,
                "gap": round(gap, 1),
                "current": current_level,
                "required": req_level
            })

    # Overall Match Score Calculation (%)
    match_score = round((acquired_weight / total_weight * 100), 1) if total_weight > 0 else 0

    return {
        "match_score": match_score,
        "skill_gaps": roadmaps
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)