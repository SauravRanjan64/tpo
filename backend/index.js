import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const server = http.createServer(app);

// Build allowed origins from env var (comma-separated) with sensible defaults
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://placement-dcrust.vercel.app'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// In-memory Database
let students = [
  {
    id: 'std-1',
    name: 'Rahul Sharma',
    email: 'student@dcrust.ac.in',
    rollNumber: '21001001045',
    registrationNumber: '21DCRUST045',
    branch: 'CSE',
    batch: 2025,
    semester: 7,
    cgpa: 8.2,
    activeBacklogs: 0,
    phone: '+91 9876543210',
    graduationYear: 2025,
    consentGiven: true,
    resume: {
      fileName: 'Rahul_Sharma_CSE_Resume.pdf',
      uploadDate: '2026-08-14',
      fileSize: '1.4 MB',
      skills: ['React', 'Node.js', 'Express', 'JavaScript', 'SQL', 'Git', 'Data Structures']
    }
  },
  {
    id: 'std-2',
    name: 'Priya Verma',
    email: 'priya@dcrust.ac.in',
    rollNumber: '21001002018',
    registrationNumber: '21DCRUST118',
    branch: 'ECE',
    batch: 2025,
    semester: 7,
    cgpa: 6.4,
    activeBacklogs: 1,
    phone: '+91 9812345678',
    graduationYear: 2025,
    consentGiven: true,
    resume: {
      fileName: 'Priya_Verma_ECE_Resume.pdf',
      uploadDate: '2026-08-18',
      fileSize: '950 KB',
      skills: ['C++', 'Embedded Systems', 'VLSI', 'MATLAB']
    }
  },
  {
    id: 'std-3',
    name: 'Aman Malik',
    email: 'aman@dcrust.ac.in',
    rollNumber: '22001003009',
    registrationNumber: '22DCRUST209',
    branch: 'Mechanical',
    batch: 2026,
    semester: 5,
    cgpa: 7.5,
    activeBacklogs: 0,
    phone: '+91 9898989898',
    graduationYear: 2026,
    consentGiven: false,
    resume: null
  }
];

let companies = [
  {
    id: 'comp-1',
    name: 'ABC Technologies',
    industry: 'Information Technology & Software Services',
    email: 'recruiter@tcs.com',
    location: 'Gurugram / Noida',
    verified: true,
    activeDrivesCount: 1,
    contactPerson: 'Rajesh Mittal (Lead Campus Recruiter)',
    phone: '+91 124 4567890',
    about: 'Leading global enterprise technology and IT consulting organization.'
  }
];

let drives = [
  {
    id: 'job-1',
    companyId: 'comp-1',
    companyName: 'ABC Technologies',
    title: 'Software Engineer',
    location: 'Gurugram / Noida',
    salaryRange: '₹6–8 LPA',
    jobType: 'Full-Time',
    description: 'We are looking for enthusiastic Software Engineers with strong foundation in data structures, algorithms, web technologies, and database design.',
    requiredSkills: ['React', 'Node.js', 'Express', 'SQL', 'Git'],
    allowedBranches: ['CSE', 'IT', 'ECE'],
    minCgpa: 7.0,
    maxBacklogs: 0,
    eligibleBatch: 2025,
    applicationStart: '2026-09-01',
    applicationEnd: '2026-09-28',
    status: 'ACTIVE'
  }
];

let applications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    studentId: 'std-1',
    appliedOn: '2026-09-15T10:30:00Z',
    status: 'APPLIED',
    matchScore: 82,
    matchedSkills: ['React', 'Node.js', 'Express', 'SQL', 'Git'],
    missingSkills: [],
    timeline: [
      { status: 'APPLIED', timestamp: '2026-09-15T10:30:00Z', note: 'Application submitted successfully.' }
    ],
    eligibilitySnapshot: {
      cgpa: { student: 8.2, required: 7.0, pass: true },
      branch: { student: 'CSE', allowed: ['CSE', 'IT', 'ECE'], pass: true },
      backlogs: { student: 0, maxAllowed: 0, pass: true },
      batch: { student: 2025, required: 2025, pass: true }
    }
  }
];

let notifications = [
  {
    id: 'notif-1',
    recipientId: 'std-1',
    title: 'Welcome to Placement Portal',
    message: 'Placement drive registrations are now active.',
    timestamp: new Date().toISOString(),
    read: false
  }
];

let auditLogs = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    actor: 'System Initialization',
    action: 'PORTAL_BOOTSTRAP',
    details: 'Node.js + Express REST API initialized.'
  }
];

// Helper: Mask phone number (98******90)
function maskPhone(phone) {
  if (!phone) return 'N/A';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 6) return phone;
  return `${digits.slice(0, 2)}${'*'.repeat(Math.max(4, digits.length - 4))}${digits.slice(-2)}`;
}

// Session helper
function getSessionUser(req) {
  const cookieUser = req.cookies?.placement_session;
  if (cookieUser) {
    try {
      return JSON.parse(cookieUser);
    } catch {
      return null;
    }
  }
  return null;
}

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
  const { email, role } = req.body;
  let user = null;

  if (email === 'admin@dcrust.ac.in' || email === 'admin@dcrust.edu.in' || role === 'ADMIN') {
    user = {
      id: 'admin-1',
      name: 'Dr. R. K. Sehrawat',
      email: 'admin@dcrust.ac.in',
      role: 'ADMIN',
      designation: 'Head, Training & Placement Cell'
    };
  } else if (email?.includes('tcs') || role === 'COMPANY') {
    const comp = companies[0];
    user = {
      id: comp.id,
      name: comp.contactPerson,
      email: comp.email,
      companyName: comp.name,
      role: 'COMPANY'
    };
  } else {
    user = students.find(s => s.email === email) || students[0];
    user = { ...user, role: 'STUDENT' };
  }

  // Set HttpOnly cookie
  res.cookie('placement_session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ user, message: 'Logged in successfully' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('placement_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  res.json({ user });
});

app.post('/api/auth/consent', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });

  students = students.map(s => s.id === user.id ? { ...s, consentGiven: true } : s);
  user.consentGiven = true;

  res.cookie('placement_session', JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ success: true, user });
});

// --- STUDENT ENDPOINTS ---
app.get('/api/student/profile', (req, res) => {
  const user = getSessionUser(req);
  const student = students.find(s => s.id === user?.id) || students[0];
  res.json({ student });
});

app.put('/api/student/profile', (req, res) => {
  const user = getSessionUser(req);
  students = students.map(s => s.id === (user?.id || 'std-1') ? { ...s, ...req.body } : s);
  const updated = students.find(s => s.id === (user?.id || 'std-1'));
  res.json({ student: updated });
});

app.get('/api/student/stats', (req, res) => {
  const user = getSessionUser(req);
  const myApps = applications.filter(a => a.studentId === (user?.id || 'std-1'));
  res.json({
    availableJobs: drives.filter(d => d.status === 'ACTIVE').length,
    myApplications: myApps.length,
    shortlisted: myApps.filter(a => a.status === 'SHORTLISTED').length,
    selected: myApps.filter(a => a.status === 'SELECTED').length,
  });
});

// --- JOBS & ELIGIBILITY ---
app.get('/api/jobs', (req, res) => {
  let result = [...drives];
  const { search, branch, status } = req.query;
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(j => j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q));
  }
  if (branch && branch !== 'ALL') {
    result = result.filter(j => j.allowedBranches.includes(branch));
  }
  if (status && status !== 'ALL') {
    result = result.filter(j => j.status === status);
  }
  res.json({ jobs: result, total: result.length });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = drives.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Drive not found' });
  res.json({ job });
});

app.get('/api/jobs/:id/eligibility', (req, res) => {
  const job = drives.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Drive not found' });

  const user = getSessionUser(req);
  const student = students.find(s => s.id === user?.id) || students[0];

  const cgpaPass = student.cgpa >= job.minCgpa;
  const branchPass = job.allowedBranches.includes(student.branch);
  const backlogsPass = student.activeBacklogs <= job.maxBacklogs;
  const batchPass = student.batch === job.eligibleBatch;

  const isEligible = cgpaPass && branchPass && backlogsPass && batchPass;
  const reasons = [];
  if (!cgpaPass) reasons.push(`CGPA is below required ${job.minCgpa} (Your CGPA: ${student.cgpa}).`);
  if (!branchPass) reasons.push(`Branch ${student.branch} is not among allowed disciplines.`);
  if (!backlogsPass) reasons.push(`Active backlogs (${student.activeBacklogs}) exceed maximum allowed (${job.maxBacklogs}).`);
  if (!batchPass) reasons.push(`Eligible batch is ${job.eligibleBatch} (Your batch: ${student.batch}).`);

  res.json({
    eligible: isEligible,
    details: {
      cgpa: { student: student.cgpa, required: job.minCgpa, pass: cgpaPass },
      branch: { student: student.branch, allowed: job.allowedBranches, pass: branchPass },
      backlogs: { student: student.activeBacklogs, maxAllowed: job.maxBacklogs, pass: backlogsPass },
      batch: { student: student.batch, required: job.eligibleBatch, pass: batchPass }
    },
    reasons
  });
});

// --- APPLICATIONS ---
app.post('/api/applications', (req, res) => {
  const { jobId } = req.body;
  const job = drives.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ message: 'Drive not found' });

  const user = getSessionUser(req);
  const student = students.find(s => s.id === user?.id) || students[0];

  const newApp = {
    id: `app-${Date.now()}`,
    jobId,
    studentId: student.id,
    appliedOn: new Date().toISOString(),
    status: 'APPLIED',
    matchScore: 80,
    timeline: [{ status: 'APPLIED', timestamp: new Date().toISOString(), note: 'Application registered.' }],
    eligibilitySnapshot: {
      cgpa: { student: student.cgpa, required: job.minCgpa, pass: true },
      branch: { student: student.branch, allowed: job.allowedBranches, pass: true },
      backlogs: { student: student.activeBacklogs, maxAllowed: job.maxBacklogs, pass: true },
      batch: { student: student.batch, required: job.eligibleBatch, pass: true }
    }
  };

  applications.unshift(newApp);
  res.status(201).json({ application: newApp, message: 'Application submitted successfully.' });
});

app.get('/api/applications/my', (req, res) => {
  const user = getSessionUser(req);
  const myApps = applications
    .filter(a => a.studentId === (user?.id || 'std-1'))
    .map(a => {
      const j = drives.find(d => d.id === a.jobId) || {};
      return {
        ...a,
        jobTitle: j.title || 'Software Engineer',
        companyName: j.companyName || 'Company',
        location: j.location || 'NCR'
      };
    });
  res.json({ applications: myApps });
});

app.get('/api/applications/:id', (req, res) => {
  const appItem = applications.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ message: 'Application not found' });
  const job = drives.find(j => j.id === appItem.jobId) || {};
  res.json({ application: { ...appItem, job } });
});

// --- RESUME ---
app.get('/api/resume', (req, res) => {
  const user = getSessionUser(req);
  const student = students.find(s => s.id === user?.id) || students[0];
  res.json({ resume: student.resume });
});

app.post('/api/resume/upload', (req, res) => {
  const user = getSessionUser(req);
  const newResume = {
    fileName: req.body.fileName || 'Student_Resume.pdf',
    uploadDate: new Date().toISOString().split('T')[0],
    fileSize: req.body.fileSize || '1.2 MB',
    skills: req.body.skills || ['React', 'Node.js', 'SQL', 'Git']
  };
  students = students.map(s => s.id === (user?.id || 'std-1') ? { ...s, resume: newResume } : s);
  res.json({ resume: newResume });
});

app.delete('/api/resume', (req, res) => {
  const user = getSessionUser(req);
  students = students.map(s => s.id === (user?.id || 'std-1') ? { ...s, resume: null } : s);
  res.json({ message: 'Resume deleted' });
});

app.post('/api/resume/match', (req, res) => {
  const { jobId } = req.body;
  const job = drives.find(j => j.id === jobId) || drives[0];
  const user = getSessionUser(req);
  const student = students.find(s => s.id === user?.id) || students[0];
  const resumeSkills = student.resume?.skills || ['React', 'Node.js', 'SQL'];

  const matched = job.requiredSkills.filter(s => resumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
  const missing = job.requiredSkills.filter(s => !matched.includes(s));
  const matchScore = Math.round((matched.length / job.requiredSkills.length) * 100);

  res.json({
    matchScore,
    matchedSkills: matched,
    missingSkills: missing,
    targetJob: job,
    disclaimer: 'These suggestions are based on keyword matching and are not a hiring decision.'
  });
});

// --- RECRUITER ACTIONS (SHORTLIST & REJECT) ---
app.get('/api/company/stats', (req, res) => {
  res.json({
    activeDrives: drives.length,
    totalApplicants: applications.length,
    eligibleCandidates: applications.length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    selected: applications.filter(a => a.status === 'SELECTED').length,
  });
});

app.get('/api/company/applicants', (req, res) => {
  const enriched = applications.map(a => {
    const s = students.find(st => st.id === a.studentId) || {};
    const isAuthorized = a.status === 'SHORTLISTED' || a.status === 'SELECTED';
    return {
      ...a,
      studentName: s.name,
      rollNumber: s.rollNumber,
      branch: s.branch,
      cgpa: s.cgpa,
      phone: isAuthorized ? s.phone : maskPhone(s.phone),
      email: isAuthorized ? s.email : `${s.rollNumber}@dcrust.ac.in`
    };
  });
  res.json({ applicants: enriched });
});

app.post('/api/company/applications/:id/shortlist', (req, res) => {
  const appItem = applications.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ message: 'Application not found' });

  appItem.status = 'SHORTLISTED';
  appItem.timeline.push({ status: 'SHORTLISTED', timestamp: new Date().toISOString(), note: 'Shortlisted by recruiter.' });

  const job = drives.find(j => j.id === appItem.jobId);

  // Broadcast real-time Socket.IO notification
  io.emit('application:status_updated', {
    applicationId: appItem.id,
    studentId: appItem.studentId,
    status: 'SHORTLISTED',
    companyName: job?.companyName,
    jobTitle: job?.title,
    message: `Your application for ${job?.title} at ${job?.companyName} has been shortlisted.`
  });

  res.json({ application: appItem, message: 'Applicant shortlisted successfully' });
});

app.post('/api/company/applications/:id/reject', (req, res) => {
  const appItem = applications.find(a => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ message: 'Application not found' });

  appItem.status = 'REJECTED';
  appItem.rejectionReason = req.body.reason || 'Candidate profile not aligned.';
  appItem.timeline.push({ status: 'REJECTED', timestamp: new Date().toISOString(), note: appItem.rejectionReason });

  io.emit('application:status_updated', {
    applicationId: appItem.id,
    studentId: appItem.studentId,
    status: 'REJECTED',
    message: `Your application status has been updated.`
  });

  res.json({ application: appItem, message: 'Application rejected.' });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json({ notifications });
});

app.patch('/api/notifications/read-all', (req, res) => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  res.json({ success: true });
});

app.patch('/api/notifications/:id/read', (req, res) => {
  notifications = notifications.map(n =>
    n.id === req.params.id ? { ...n, read: true } : n
  );
  res.json({ success: true });
});

// --- ADMIN ROUTES ---
app.get('/api/admin/stats', (req, res) => {
  res.json({
    totalStudents: students.length,
    totalCompanies: companies.length,
    activeDrives: drives.filter(d => d.status === 'ACTIVE').length,
    totalApplications: applications.length,
    shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
    selected: applications.filter(a => a.status === 'SELECTED').length,
  });
});

app.get('/api/admin/students', (req, res) => {
  res.json({ students, total: students.length });
});

app.get('/api/admin/companies', (req, res) => {
  res.json({ companies, total: companies.length });
});

app.patch('/api/admin/companies/:id/verify', (req, res) => {
  companies = companies.map(c => c.id === req.params.id ? { ...c, verified: true } : c);
  const comp = companies.find(c => c.id === req.params.id);
  res.json({ company: comp });
});

app.get('/api/admin/jobs', (req, res) => {
  res.json({ jobs: drives, total: drives.length });
});

app.post('/api/admin/jobs', (req, res) => {
  const newDrive = { id: `job-${Date.now()}`, ...req.body, status: 'ACTIVE' };
  drives.unshift(newDrive);
  res.status(201).json({ job: newDrive });
});

app.get('/api/admin/applications', (req, res) => {
  const enriched = applications.map(a => {
    const s = students.find(st => st.id === a.studentId) || {};
    const j = drives.find(d => d.id === a.jobId) || {};
    return { ...a, studentName: s.name, branch: s.branch, cgpa: s.cgpa, jobTitle: j.title, companyName: j.companyName };
  });
  res.json({ applications: enriched, total: enriched.length });
});

app.get('/api/admin/audit', (req, res) => {
  res.json({ logs: auditLogs });
});

app.get('/api/admin/exports/csv', (req, res) => {
  const headers = ['id', 'studentName', 'branch', 'cgpa', 'jobTitle', 'companyName', 'status', 'appliedOn'];
  const rows = applications.map(a => {
    const s = students.find(st => st.id === a.studentId) || {};
    const j = drives.find(d => d.id === a.jobId) || {};
    return [a.id, s.name, s.branch, s.cgpa, j.title, j.companyName, a.status, a.appliedOn].join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=applications.csv');
  res.send(csv);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DCRUST Placement Backend running on http://localhost:${PORT}`);

  // Keep-alive: ping self every 4 minutes to prevent Render free tier spin-down
  if (process.env.NODE_ENV === 'production') {
    const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `https://placement-dcrust.onrender.com`;
    setInterval(() => {
      fetch(`${BACKEND_URL}/health`)
        .then(() => console.log('[keep-alive] ping sent'))
        .catch((err) => console.warn('[keep-alive] ping failed:', err.message));
    }, 4 * 60 * 1000); // every 4 minutes
  }
});

// Health check endpoint (used by keep-alive ping)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
