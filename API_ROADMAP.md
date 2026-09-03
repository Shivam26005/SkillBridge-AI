
# v4 API Roadmap

Current v3 APIs remain compatible.

## Recommended next production endpoints

POST /api/profile/resume
- Upload resume
- Extract skills
- Update student profile

POST /api/certificates
- Upload certificate metadata
- Store verification status

GET /api/career/roles
- Return target roles and required skill vectors

POST /api/career/simulator
- Input target role
- Return readiness, gaps and roadmap

POST /api/mentorship/request
- Student requests faculty/industry mentor

GET /api/notifications
- Application, shortlist, event and mentorship notifications

POST /api/admin/opportunities/:id/approve
- Institution/admin approval workflow

## Production security checklist
- Move secrets to environment variables
- Use HTTPS
- Validate all uploads
- Add file size/type restrictions
- Add rate limiting
- Add audit logs
- Use refresh-token rotation
- Hash passwords with bcrypt/Argon2
- Add database indexes
- Use object storage for documents
