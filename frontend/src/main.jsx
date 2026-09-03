
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer} from 'recharts';
import './styles.css';

const API='http://localhost:5000/api';
async function api(path,opt={}){const token=localStorage.getItem('token');const r=await fetch(API+path,{...opt,headers:{'content-type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...(opt.headers||{})}});const d=await r.json();if(!r.ok)throw Error(d.message||'Request failed');return d}

function Login({onLogin}){const [email,setEmail]=useState('demo@student.com'),[password,setPassword]=useState('demo'),[role,setRole]=useState('student'),[err,setErr]=useState('');
async function submit(e){e.preventDefault();try{const d=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});if(d.user.role!==role){setErr('Selected role does not match this account.');return}localStorage.setItem('token',d.token);localStorage.setItem('user',JSON.stringify(d.user));onLogin(d.user)}catch(x){setErr(x.message)}}
return <div className="login"><div className="loginCard"><div className="logo">SB</div><h1>SkillBridge AI</h1><p>From Skills to Opportunities</p><div className="roleGrid">{['student','industry','faculty','institution'].map(r=><button className={role===r?'role active':'role'} onClick={()=>setRole(r)}>{r}</button>)}</div><form onSubmit={submit}><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/><input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/><button className="primary">Sign in</button></form>{err&&<div className="error">{err}</div>}<small>Demo passwords: demo</small></div></div>}


function HeroBanner({role}) {
  return <section className="hero">
    <div>
      <div className="eyebrow">SIH 2026 • SKILL INTELLIGENCE</div>
      <h1>Turn skill gaps into real opportunities.</h1>
      <p>SkillBridge AI connects assessment, learning, mentorship, internships and placement in one explainable career loop.</p>
    </div>
    <div className="heroFlow">
      <span>Assess</span><i>→</i><span>Analyze</span><i>→</i><span>Learn</span><i>→</i><span>Match</span><i>→</i><span>Place</span>
    </div>
  </section>
}

function Layout({user,onLogout,children}){return <><header><div className="brand"><span>SB</span> SkillBridge AI</div><div>{user.name} · <b>{user.role}</b> <button onClick={onLogout}>Logout</button></div></header><main>{children}</main></>}

function Card({title,value,sub}){return <div className="card stat"><div>{title}</div><strong>{value}</strong><small>{sub}</small></div>}

function Student(){const [skills,setSkills]=useState([]),[recs,setRecs]=useState([]),[apps,setApps]=useState([]),[tab,setTab]=useState('overview');
useEffect(()=>{Promise.all([api('/student/skills'),api('/opportunities/recommendations'),api('/student/applications')]).then(([a,b,c])=>{setSkills(a);setRecs(b);setApps(c)})},[]);
async function save(){await api('/student/skills',{method:'PUT',body:JSON.stringify({skills:skills.map(s=>({skill_id:s.id,proficiency:Number(s.proficiency)}))})});alert('Skills saved');}
return <div><HeroBanner role="student"/><nav>{['overview','assessment','opportunities','portfolio'].map(t=><button className={tab===t?'tab on':'tab'} onClick={()=>setTab(t)}>{t}</button>)}</nav>
{tab==='overview'&&<><h2>Student Command Center 🎓</h2><div className="stats"><Card title="Skills tracked" value={skills.length} sub="Your profile signals"/><Card title="Top match" value={(recs[0]?.score||0)+'%'} sub={recs[0]?.title||'No match yet'}/><Card title="Applications" value={apps.length} sub="Tracked applications"/></div><section className="panel"><h3>AI Career Gap</h3><p>Pick an opportunity in the Opportunities tab to see where your strongest skill gaps are.</p>{recs.slice(0,3).map(r=><div className="row"><b>{r.title}</b><span className="badge">{r.score}% match</span></div>)}</section></>}
{tab==='assessment'&&<section className="panel"><h2>Skill Assessment</h2><p>Rate each skill from 0 to 100.</p>{skills.map(s=><div className="skill"><label>{s.name}<b>{s.proficiency}</b></label><input type="range" min="0" max="100" value={s.proficiency} onChange={e=>setSkills(skills.map(x=>x.id===s.id?{...x,proficiency:e.target.value}:x))}/></div>)}<button className="primary" onClick={save}>Save & Recalculate</button></section>}
{tab==='opportunities'&&<section><h2>AI-Matched Opportunities 🚀</h2>{recs.map(r=><div className="op"><div><h3>{r.title}</h3><p>{r.company} · {r.location} · {r.type}</p><p>{r.description}</p></div><div className="match">{r.score}%<small>match</small><button onClick={()=>api('/opportunities/'+r.id+'/apply',{method:'POST'}).then(()=>alert('Applied!'))}>Apply</button></div><div className="tags">{(r.roadmap||[]).map(x=><span>{x.skill} gap {Math.round(x.gap)}</span>)}</div></div>)}</section>}
{tab==='portfolio'&&<section className="panel"><h2>Digital Portfolio</h2><div className="portfolio"><h3>{localStorage.getItem('user')&&JSON.parse(localStorage.getItem('user')).name}</h3><p>Computer Engineering · AI-generated skill profile</p>{skills.filter(s=>s.proficiency>=70).map(s=><span className="pill">{s.name} {s.proficiency}</span>)}</div></section>}
</div>}

function Industry(){const [data,setData]=useState(null),[cand,setCand]=useState([]),[form,setForm]=useState({title:'',type:'internship',location:'Pune',description:'',stipend:''});
const load=()=>Promise.all([api('/industry/overview'),api('/industry/candidates')]).then(([a,b])=>{setData(a);setCand(b)});useEffect(load,[]);
async function create(e){e.preventDefault();await api('/industry/opportunities',{method:'POST',body:JSON.stringify(form)});setForm({...form,title:''});load()}
return <><HeroBanner role="industry"/><h2>Industry Talent Hub 🏢</h2>{data&&<div className="stats"><Card title="Student pool" value={data.students} sub="Discoverable profiles"/><Card title="Applications" value={data.applications} sub="Your opportunities"/><Card title="Shortlisted" value={data.shortlisted} sub="Pipeline"/></div>}<div className="two"><section className="panel"><h3>Post Internship / Job</h3><form onSubmit={create}>{['title','location','description','stipend'].map(k=><input placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}<button className="primary">Publish</button></form></section><section className="panel"><h3>AI Candidate Ranking</h3>{cand.slice(0,8).map(c=><div className="row"><span>{c.name}<small> {c.department}</small></span><b className="badge">{c.match_score}%</b></div>)}</section></div></>}

function Faculty(){const [data,setData]=useState(),[items,setItems]=useState([]),[form,setForm]=useState({title:'',type:'FDP',organization:'',description:''});
const load=()=>Promise.all([api('/faculty/overview'),api('/faculty/programs')]).then(([a,b])=>{setData(a);setItems(b)});useEffect(load,[]);
async function add(e){e.preventDefault();await api('/faculty/programs',{method:'POST',body:JSON.stringify(form)});setForm({title:'',type:'FDP',organization:'',description:''});load()}
return <><HeroBanner role="faculty"/><h2>Faculty Collaboration Hub 👩‍🏫</h2>{data&&<div className="stats"><Card title="Programs" value={data.programs} sub="FDP / internships / research"/><Card title="Mentorships" value={data.activeMentorships} sub="Active"/><Card title="Industry projects" value={data.industryProjects} sub="Available"/></div>}<div className="two"><section className="panel"><h3>Create Faculty Program</h3><form onSubmit={add}>{['title','organization','description'].map(k=><input placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>) }<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>FDP</option><option>faculty_internship</option><option>research</option><option>guest_lecture</option><option>mentorship</option></select><button className="primary">Publish</button></form></section><section className="panel"><h3>My Programs</h3>{items.map(x=><div className="row"><b>{x.title}</b><span>{x.type}</span></div>)}</section></div></>}

function Institution(){const [d,setD]=useState(),[events,setEvents]=useState([]),[form,setForm]=useState({title:'',type:'workshop',event_date:'',description:''});
const load=()=>Promise.all([api('/institution/analytics'),api('/institution/events')]).then(([a,b])=>{setD(a);setEvents(b)});useEffect(load,[]);
async function add(e){e.preventDefault();await api('/institution/events',{method:'POST',body:JSON.stringify(form)});load()}
return <><HeroBanner role="institution"/><h2>Institution Intelligence Center 🏫</h2>{d&&<><div className="stats"><Card title="Students" value={d.students} sub="Registered learners"/><Card title="Internship-ready" value={d.internshipReady} sub="Shortlisted / selected"/><Card title="Avg skill score" value={d.avgSkill} sub="Across tracked skills"/></div><div className="two"><section className="panel"><h3>Skill Demand</h3><ResponsiveContainer width="100%" height={260}><BarChart data={d.demand}><XAxis dataKey="skill"/><YAxis/><Tooltip/><Bar dataKey="demand"/></BarChart></ResponsiveContainer></section><section className="panel"><h3>Department Distribution</h3>{d.departments.map(x=><div className="row"><b>{x.department||'Unspecified'}</b><span>{x.students}</span></div>)}</section></div></>}<section className="panel"><h3>Institution Events</h3><form className="inline" onSubmit={add}><input placeholder="title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input type="date" value={form.event_date} onChange={e=>setForm({...form,event_date:e.target.value})}/><button className="primary">Add</button></form>{events.map(x=><div className="row"><b>{x.title}</b><span>{x.event_date} · {x.type}</span></div>)}</section></>}

function App(){const [user,setUser]=useState(JSON.parse(localStorage.getItem('user')||'null'));if(!user)return <Login onLogin={setUser}/>;const out=()=>{localStorage.clear();setUser(null)};return <Layout user={user} onLogout={out}>{user.role==='student'?<Student/>:user.role==='industry'?<Industry/>:user.role==='faculty'?<Faculty/>:<Institution/>}</Layout>}
createRoot(document.getElementById('root')).render(<App/>);
