
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="SkillBridge AI Recommendation Engine")

class Skill(BaseModel):
    name: str
    current: float
    required: float
    weight: float = 1.0

class MatchRequest(BaseModel):
    skills: List[Skill]

def score(skills):
    total_w = sum(max(s.weight, 0.1) for s in skills) or 1
    weighted = sum(min(s.current / max(s.required,1), 1) * max(s.weight,0.1) for s in skills)
    return round(100 * weighted / total_w, 1)

@app.get("/health")
def health():
    return {"status":"ok","engine":"SkillBridge AI v3"}

@app.post("/match")
def match(req: MatchRequest):
    missing, weak = [], []
    for s in req.skills:
        gap = max(s.required - s.current, 0)
        if s.current <= 0:
            missing.append({"skill":s.name,"gap":round(gap,1),"priority":round(gap*max(s.weight,1),1)})
        elif s.current < s.required:
            weak.append({"skill":s.name,"current":s.current,"required":s.required,"gap":round(gap,1),
                         "priority":round(gap*max(s.weight,1),1)})
    roadmap = sorted(missing + weak, key=lambda x:x["priority"], reverse=True)[:5]
    return {"score":score(req.skills),"missing_skills":missing,"weak_skills":weak,"roadmap":roadmap}
