from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="SkillBridge AI - Recommendation Engine")

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

    student_map = {
        skill.name.lower(): skill.proficiency
        for skill in data.student_skills
    }

    total_weight = 0
    acquired_weight = 0
    skill_gaps = []

    for req in data.job_requirements:

        skill_key = req.skill.lower()
        required_level = req.required_level

        total_weight += required_level

        current_level = student_map.get(skill_key, 0)

        acquired_weight += min(current_level, required_level)

        gap = max(0, required_level - current_level)

        if gap > 0:
            skill_gaps.append({
                "skill": req.skill,
                "gap": round(gap, 1),
                "current": current_level,
                "required": required_level
            })

    match_score = (
        round((acquired_weight / total_weight) * 100, 1)
        if total_weight > 0
        else 0
    )

    return {
        "match_score": match_score,
        "skill_gaps": skill_gaps
    }


@app.get("/")
def home():
    return {
        "message": "SkillBridge AI service is running"
    }


if __name__ == "__main__":
    import uvicorn
    import os

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8001))
    )