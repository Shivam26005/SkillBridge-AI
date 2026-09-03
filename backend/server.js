
require('dotenv').config();
const express=require('express'), cors=require('cors'), bcrypt=require('bcryptjs'), jwt=require('jsonwebtoken'), mysql=require('mysql2/promise');
const app=express(); app.use(cors()); app.use(express.json());
const pool=mysql.createPool({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,waitForConnections:true,connectionLimit:10});
const roles=['student','industry','faculty','institution'];
function auth(req,res,next){try{const h=req.headers.authorization||'';req.user=jwt.verify(h.replace('Bearer ',''),process.env.JWT_SECRET);next()}catch(e){res.status(401).json({message:'Unauthorized'})}}
function allow(...rs){return (req,res,next)=>rs.includes(req.user.role)?next():res.status(403).json({message:'Forbidden for this role'})}
app.get('/api/health',(req,res)=>res.json({status:'ok'}));

app.post('/api/auth/register',async(req,res)=>{try{
 const {name,email,password,role='student',department}=req.body;
 if(!name||!email||!password||!roles.includes(role)) return res.status(400).json({message:'Invalid registration'});
 const hash=await bcrypt.hash(password,10); const [r]=await pool.execute('INSERT INTO users(name,email,password_hash,role,department) VALUES(?,?,?,?,?)',[name,email,hash,role,department||null]);
 const token=jwt.sign({id:r.insertId,name,email,role,department},process.env.JWT_SECRET,{expiresIn:'8h'}); res.json({token,user:{id:r.insertId,name,email,role,department}});
}catch(e){res.status(400).json({message:e.code==='ER_DUP_ENTRY'?'Email already registered':e.message})}});

app.post('/api/auth/login',async(req,res)=>{try{
 const [rows]=await pool.execute('SELECT * FROM users WHERE email=?',[req.body.email]); if(!rows[0]) return res.status(401).json({message:'Invalid credentials'});
 const u=rows[0]; if(!(await bcrypt.compare(req.body.password,u.password_hash))) return res.status(401).json({message:'Invalid credentials'});
 const token=jwt.sign({id:u.id,name:u.name,email:u.email,role:u.role,department:u.department},process.env.JWT_SECRET,{expiresIn:'8h'}); res.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role,department:u.department}});
}catch(e){res.status(500).json({message:e.message})}});

app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/skills',async(req,res)=>{const [r]=await pool.query('SELECT * FROM skills ORDER BY category,name');res.json(r)});

app.get('/api/opportunities',async(req,res)=>{const [r]=await pool.query(`SELECT o.*,c.name company FROM opportunities o JOIN companies c ON c.id=o.company_id ORDER BY o.created_at DESC`);res.json(r)});
app.get('/api/opportunities/recommendations',auth,allow('student'),async(req,res)=>{
 const [ops]=await pool.query(`SELECT o.id,o.title,o.type,o.location,o.description,o.stipend,c.name company,
 GROUP_CONCAT(CONCAT(s.name,':',os.required_level,':',os.weight) SEPARATOR '|') reqs
 FROM opportunities o JOIN companies c ON c.id=o.company_id JOIN opportunity_skills os ON os.opportunity_id=o.id JOIN skills s ON s.id=os.skill_id GROUP BY o.id ORDER BY o.created_at DESC`);
 const [ss]=await pool.execute(`SELECT s.name,ss.proficiency FROM student_skills ss JOIN skills s ON s.id=ss.skill_id WHERE ss.user_id=?`,[req.user.id]);
 const map=Object.fromEntries(ss.map(x=>[x.name,Number(x.proficiency)]));
 const out=await Promise.all(ops.map(async o=>{
   const skills=(o.reqs||'').split('|').filter(Boolean).map(x=>{const [name,required,weight]=x.split(':');return {name,current:map[name]||0,required:Number(required),weight:Number(weight)}});
   let ai={score:0,missing_skills:[],weak_skills:[],roadmap:[]};
   try{const r=await fetch((process.env.AI_SERVICE_URL||'http://localhost:8000')+'/match',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({skills})});ai=await r.json()}catch(e){}
   return {...o,score:ai.score,missing_skills:ai.missing_skills,roadmap:ai.roadmap};
 })); res.json(out);
});
app.get('/api/student/skills',auth,allow('student'),async(req,res)=>{const [r]=await pool.execute(`SELECT s.id,s.name,s.category,COALESCE(ss.proficiency,0) proficiency FROM skills s LEFT JOIN student_skills ss ON ss.skill_id=s.id AND ss.user_id=? ORDER BY s.category,s.name`,[req.user.id]);res.json(r)});
app.put('/api/student/skills',auth,allow('student'),async(req,res)=>{for(const x of req.body.skills||[]) await pool.execute(`INSERT INTO student_skills(user_id,skill_id,proficiency) VALUES(?,?,?) ON DUPLICATE KEY UPDATE proficiency=VALUES(proficiency)`,[req.user.id,x.skill_id,x.proficiency]);res.json({message:'Skills updated'})});
app.post('/api/opportunities/:id/apply',auth,allow('student'),async(req,res)=>{await pool.execute('INSERT IGNORE INTO applications(opportunity_id,student_id) VALUES(?,?)',[req.params.id,req.user.id]);res.json({message:'Application submitted'})});
app.get('/api/student/applications',auth,allow('student'),async(req,res)=>{const [r]=await pool.execute(`SELECT a.*,o.title,c.name company FROM applications a JOIN opportunities o ON o.id=a.opportunity_id JOIN companies c ON c.id=o.company_id WHERE a.student_id=? ORDER BY a.applied_at DESC`,[req.user.id]);res.json(r)});

app.get('/api/industry/overview',auth,allow('industry'),async(req,res)=>{
 const [[students]]=await pool.query("SELECT COUNT(*) total FROM users WHERE role='student'");
 const [[apps]]=await pool.query("SELECT COUNT(*) total FROM applications a JOIN opportunities o ON o.id=a.opportunity_id JOIN companies c ON c.id=o.company_id WHERE c.user_id=?",[req.user.id]);
 const [[short]]=await pool.query("SELECT COUNT(*) total FROM applications a JOIN opportunities o ON o.id=a.opportunity_id JOIN companies c ON c.id=o.company_id WHERE c.user_id=? AND a.status='shortlisted'",[req.user.id]);
 const [opps]=await pool.execute("SELECT o.*,COUNT(a.id) applications FROM opportunities o JOIN companies c ON c.id=o.company_id LEFT JOIN applications a ON a.opportunity_id=o.id WHERE c.user_id=? GROUP BY o.id ORDER BY o.created_at DESC",[req.user.id]);
 res.json({students:students.total,applications:apps.total,shortlisted:short.total,opportunities:opps});
});
app.get('/api/industry/candidates',auth,allow('industry'),async(req,res)=>{
 const [students]=await pool.query("SELECT id,name,email,department FROM users WHERE role='student'");
 const [skills]=await pool.query(`SELECT ss.user_id,s.name,ss.proficiency FROM student_skills ss JOIN skills s ON s.id=ss.skill_id`);
 const by={}; skills.forEach(x=>(by[x.user_id]??=[]).push({name:x.name,current:Number(x.proficiency),required:70,weight:1}));
 const result=students.map(s=>{const sk=by[s.id]||[];const avg=sk.length?sk.reduce((a,x)=>a+Math.min(x.current/70,1),0)/sk.length*100:0;return {...s,match_score:Math.round(avg)} }).sort((a,b)=>b.match_score-a.match_score);
 res.json(result);
});
app.post('/api/industry/opportunities',auth,allow('industry'),async(req,res)=>{const [c]=await pool.execute('SELECT id FROM companies WHERE user_id=?',[req.user.id]);if(!c[0])return res.status(400).json({message:'Create company profile first'});const [r]=await pool.execute('INSERT INTO opportunities(company_id,title,type,location,description,stipend) VALUES(?,?,?,?,?,?)',[c[0].id,req.body.title,req.body.type||'internship',req.body.location,req.body.description,req.body.stipend]);res.json({id:r.insertId})});
app.patch('/api/industry/applications/:id',auth,allow('industry'),async(req,res)=>{await pool.execute(`UPDATE applications a JOIN opportunities o ON o.id=a.opportunity_id JOIN companies c ON c.id=o.company_id SET a.status=? WHERE a.id=? AND c.user_id=?`,[req.body.status,req.params.id,req.user.id]);res.json({message:'Status updated'})});

app.get('/api/faculty/overview',auth,allow('faculty'),async(req,res)=>{
 const [[programs]]=await pool.execute('SELECT COUNT(*) total FROM faculty_programs WHERE faculty_user_id=?',[req.user.id]);
 const [[active]]=await pool.execute("SELECT COUNT(*) total FROM mentorships WHERE mentor_user_id=? AND status='active'",[req.user.id]);
 const [[projects]]=await pool.query("SELECT COUNT(*) total FROM opportunities WHERE type='project'");
 res.json({programs:programs.total,activeMentorships:active.total,industryProjects:projects.total});
});
app.get('/api/faculty/programs',auth,allow('faculty'),async(req,res)=>{const [r]=await pool.execute('SELECT * FROM faculty_programs WHERE faculty_user_id=? ORDER BY created_at DESC',[req.user.id]);res.json(r)});
app.post('/api/faculty/programs',auth,allow('faculty'),async(req,res)=>{const [r]=await pool.execute('INSERT INTO faculty_programs(faculty_user_id,title,type,organization,description) VALUES(?,?,?,?,?)',[req.user.id,req.body.title,req.body.type,req.body.organization,req.body.description]);res.json({id:r.insertId})});

app.get('/api/institution/analytics',auth,allow('institution'),async(req,res)=>{
 const [[students]]=await pool.query("SELECT COUNT(*) total FROM users WHERE role='student'");
 const [[interns]]=await pool.query("SELECT COUNT(DISTINCT student_id) total FROM applications WHERE status IN ('shortlisted','selected')");
 const [[skills]]=await pool.query("SELECT ROUND(AVG(proficiency),1) avgSkill FROM student_skills");
 const [dept]=await pool.query("SELECT department,COUNT(*) students FROM users WHERE role='student' GROUP BY department ORDER BY students DESC");
 const [demand]=await pool.query(`SELECT s.name skill,COUNT(*) demand FROM opportunity_skills os JOIN skills s ON s.id=os.skill_id GROUP BY s.id ORDER BY demand DESC LIMIT 8`);
 res.json({students:students.total,internshipReady:interns.total,avgSkill:skills.avgSkill||0,departments:dept,demand});
});
app.get('/api/institution/events',auth,allow('institution'),async(req,res)=>{const [r]=await pool.execute('SELECT * FROM institution_events WHERE institution_user_id=? ORDER BY event_date',[req.user.id]);res.json(r)});
app.post('/api/institution/events',auth,allow('institution'),async(req,res)=>{const [r]=await pool.execute('INSERT INTO institution_events(institution_user_id,title,type,event_date,description) VALUES(?,?,?,?,?)',[req.user.id,req.body.title,req.body.type,req.body.event_date,req.body.description]);res.json({id:r.insertId})});

app.listen(process.env.PORT||5000,()=>console.log('SkillBridge API running'));
