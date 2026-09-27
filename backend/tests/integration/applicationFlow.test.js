import request from 'supertest';
import { createApp } from '../../src/app.js';
import { memoryDb } from '../../src/config/database.js';

describe('End-to-End Application Lifecycle & Integrity Integration Tests', () => {
  let app;
  let studentCookie;
  let student2Cookie;
  let recruiterCookie;
  let adminCookie;

  beforeEach(async () => {
    memoryDb.reset();
    app = createApp();

    // 1. Login Student 1 (Eligible: Rahul Sharma, CSE, CGPA 8.2, 0 backlogs)
    const std1Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@dcrust.ac.in', password: 'Student@123' });
    studentCookie = std1Res.headers['set-cookie'];

    // 2. Login Student 2 (Ineligible: Priya Verma, ECE, CGPA 6.4, 1 backlog)
    const std2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'priya@dcrust.ac.in', password: 'Student@123' });
    student2Cookie = std2Res.headers['set-cookie'];

    // 3. Login Recruiter (ABC Technologies)
    const recRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'recruiter@tcs.com', password: 'Recruiter@123' });
    recruiterCookie = recRes.headers['set-cookie'];

    // 4. Login Admin
    const admRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@dcrust.edu.in', password: 'Admin@123' });
    adminCookie = admRes.headers['set-cookie'];
  });

  test('Complete E2E: Eligibility Check -> Apply -> Shortlist -> Privacy Masking -> Notifications', async () => {
    // Step 1: Student checks eligibility for Job 1
    const eligRes = await request(app)
      .get('/api/jobs/job-1/eligibility')
      .set('Cookie', studentCookie);

    expect(eligRes.status).toBe(200);
    expect(eligRes.body.success).toBe(true);
    expect(eligRes.body.data.eligible).toBe(true);
    expect(eligRes.body.data.rulesVersion).toBe('V2');

    // Step 2: Student submits application (Requirement #31)
    const applyRes = await request(app)
      .post('/api/jobs/job-1/apply')
      .set('Cookie', studentCookie)
      .send();

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.success).toBe(true);
    const createdApp = applyRes.body.data.application;
    expect(createdApp.status).toBe('APPLIED');
    expect(createdApp.eligibilitySnapshot).toBeDefined();
    expect(createdApp.eligibilitySnapshot.rulesVersion).toBe('V2');
    expect(createdApp.eligibilitySnapshot.studentCgpa).toBe(8.2);

    // Step 3: Duplicate application is blocked
    const duplicateRes = await request(app)
      .post('/api/jobs/job-1/apply')
      .set('Cookie', studentCookie)
      .send();

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.code).toBe('APPLICATION_DUPLICATE');

    // Step 4: Ineligible Student 2 attempts to apply and is rejected with exact reasons
    const ineligibleRes = await request(app)
      .post('/api/jobs/job-1/apply')
      .set('Cookie', student2Cookie)
      .send();

    expect(ineligibleRes.status).toBe(400);
    expect(ineligibleRes.body.code).toBe('APPLICATION_NOT_ELIGIBLE');
    expect(ineligibleRes.body.errors.length).toBeGreaterThanOrEqual(2);
    expect(ineligibleRes.body.errors.some(e => e.rule === 'CGPA')).toBe(true);
    expect(ineligibleRes.body.errors.some(e => e.rule === 'BACKLOGS')).toBe(true);

    // Step 5: Recruiter views applicants - Phone number MUST be masked initially (Requirement #41)
    const applicantsRes = await request(app)
      .get('/api/companies/applicants')
      .set('Cookie', recruiterCookie);

    expect(applicantsRes.status).toBe(200);
    const applicant = applicantsRes.body.data.applicants.find(a => a.studentName === 'Rahul Sharma');
    expect(applicant).toBeDefined();
    expect(applicant.phone).toBe('98******10'); // Masked!

    // Step 6: Recruiter shortlists student (Requirement #37)
    const shortlistRes = await request(app)
      .post(`/api/companies/applications/${createdApp.id}/shortlist`)
      .set('Cookie', recruiterCookie)
      .send();

    expect(shortlistRes.status).toBe(200);
    expect(shortlistRes.body.data.application.status).toBe('SHORTLISTED');

    // Step 7: Recruiter phone access remains masked after shortlisting.
    const shortlistedApplicantsRes = await request(app)
      .get('/api/companies/applicants')
      .set('Cookie', recruiterCookie);

    const shortlistedApplicant = shortlistedApplicantsRes.body.data.applicants.find(a => a.id === createdApp.id);
    expect(shortlistedApplicant.phone).toBe('98******10');

    // Step 8: Student views their applications and sees updated SHORTLISTED status
    const myAppsRes = await request(app)
      .get('/api/applications/my')
      .set('Cookie', studentCookie);

    expect(myAppsRes.status).toBe(200);
    const myApp = myAppsRes.body.data.applications.find(a => a.id === createdApp.id);
    expect(myApp.status).toBe('SHORTLISTED');

    // Step 9: Cross-Student Isolation (Student 2 cannot access Student 1's application by ID)
    const crossAccessRes = await request(app)
      .get(`/api/applications/${createdApp.id}`)
      .set('Cookie', student2Cookie);

    expect(crossAccessRes.status).toBe(403);
    expect(crossAccessRes.body.code).toBe('AUTH_FORBIDDEN');
  });

  test('Admin CSV Streaming Export streams valid CSV data (Requirement #49)', async () => {
    // First submit an application
    await request(app).post('/api/jobs/job-1/apply').set('Cookie', studentCookie).send();

    const csvRes = await request(app)
      .get('/api/admin/applications/export')
      .set('Cookie', adminCookie);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('Application ID,Student Name,Roll Number,Branch,CGPA');
    expect(csvRes.text).toContain('Rahul Sharma');
  });
});
