import {
  INITIAL_STUDENTS,
  INITIAL_COMPANIES,
  INITIAL_DRIVES,
  INITIAL_APPLICATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from './mockData';

// Local storage keys for state persistence
const STORAGE_KEYS = {
  USER: 'dcrust_mock_user',
  STUDENTS: 'dcrust_mock_students',
  COMPANIES: 'dcrust_mock_companies',
  DRIVES: 'dcrust_mock_drives',
  APPLICATIONS: 'dcrust_mock_applications',
  NOTIFICATIONS: 'dcrust_mock_notifications',
  AUDIT: 'dcrust_mock_audit'
};

function loadStorage(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist to localStorage', err);
  }
}

// Initial state load
let currentSessionUser = loadStorage(STORAGE_KEYS.USER, INITIAL_STUDENTS[0]); // default to Rahul Sharma
let students = loadStorage(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
let companies = loadStorage(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
let drives = loadStorage(STORAGE_KEYS.DRIVES, INITIAL_DRIVES);
let applications = loadStorage(STORAGE_KEYS.APPLICATIONS, INITIAL_APPLICATIONS);
let notifications = loadStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
let auditLogs = loadStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);

// Listeners for mock socket events
const mockSocketListeners = new Set();

export function subscribeMockSocket(callback) {
  mockSocketListeners.add(callback);
  return () => mockSocketListeners.delete(callback);
}

export function broadcastMockSocket(event, payload) {
  mockSocketListeners.forEach(cb => {
    try {
      cb(event, payload);
    } catch (err) {
      console.error('Mock socket dispatch error', err);
    }
  });
}

// Helper to mask phone numbers: 98******90
export function maskPhoneNumber(phone) {
  if (!phone) return 'N/A';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 6) return phone;
  const firstTwo = digits.slice(0, 2);
  const lastTwo = digits.slice(-2);
  return `${firstTwo}${'*'.repeat(Math.max(4, digits.length - 4))}${lastTwo}`;
}

// Simulated mock router
export async function handleMockRequest(config) {
  // Simulate network latency (150ms - 300ms)
  await new Promise(res => setTimeout(res, 220));

  const method = config.method ? config.method.toUpperCase() : 'GET';
  const rawUrl = typeof config.url === 'string' ? config.url : '';
  const pathname = rawUrl.startsWith('http') ? new URL(rawUrl).pathname : rawUrl;
  const url = pathname
    ? pathname.split('?')[0].startsWith('/api')
      ? pathname.split('?')[0]
      : `/api${pathname.startsWith('/') ? pathname.split('?')[0] : `/${pathname.split('?')[0]}`}`
    : '/api';
  const params = config.params || {};
  let body = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      body = config.data;
    }
  }

  if (url === '/api/auth/login' && method === 'POST') {
    const { email, role } = body;
    let foundUser = null;

    if (email === 'admin@dcrust.ac.in' || role === 'ADMIN') {
      foundUser = {
        id: 'admin-1',
        name: 'Dr. R. K. Sehrawat',
        email: 'admin@dcrust.ac.in',
        role: 'ADMIN',
        designation: 'Head, Training & Placement Cell',
        department: 'T&P Central Office'
      };
    } else if (email?.includes('tcs') || email === 'recruiter@tcs.com' || role === 'COMPANY') {
      const comp = companies.find(c => c.email === email) || companies[0];
      foundUser = {
        id: comp.id,
        name: comp.contactPerson,
        email: comp.email,
        companyName: comp.name,
        role: 'COMPANY',
        verified: comp.verified
      };
    } else {
      // Find matching student by email or default
      foundUser = students.find(s => s.email === email) || students[0];
      foundUser = { ...foundUser, role: 'STUDENT' };
    }

    currentSessionUser = foundUser;
    saveStorage(STORAGE_KEYS.USER, currentSessionUser);
    return { status: 200, data: { user: currentSessionUser, message: 'Logged in successfully' } };
  }

  if (url === '/api/auth/logout' && method === 'POST') {
    currentSessionUser = null;
    saveStorage(STORAGE_KEYS.USER, null);
    return { status: 200, data: { message: 'Logged out successfully' } };
  }
  if (url === '/api/auth/me' && method === 'GET') {
    if (!currentSessionUser) {
      return { status: 401, data: { message: 'Not authenticated' } };
    }
    // Refresh student data if it's a student
    if (currentSessionUser.role === 'STUDENT') {
      const latestStudent = students.find(s => s.id === currentSessionUser.id);
      if (latestStudent) {
        currentSessionUser = { ...latestStudent, role: 'STUDENT' };
      }
    }
    return { status: 200, data: { user: currentSessionUser } };
  }

  if (url === '/api/auth/consent' && method === 'POST') {
    if (!currentSessionUser || currentSessionUser.role !== 'STUDENT') {
      return { status: 403, data: { message: 'Only students can provide placement consent' } };
    }
    students = students.map(s => s.id === currentSessionUser.id ? { ...s, consentGiven: true } : s);
    saveStorage(STORAGE_KEYS.STUDENTS, students);
    currentSessionUser = { ...currentSessionUser, consentGiven: true };
    saveStorage(STORAGE_KEYS.USER, currentSessionUser);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentSessionUser.email} (${currentSessionUser.name})`,
      action: 'PLACEMENT_CONSENT_ACCEPTED',
      details: 'Student accepted placement data processing terms.'
    });
    saveStorage(STORAGE_KEYS.AUDIT, auditLogs);

    return { status: 200, data: { success: true, message: 'Consent recorded successfully', user: currentSessionUser } };
  }

  // --- STUDENT ROUTES ---
  if (url === '/api/students/profile' && method === 'GET') {
    const student = students.find(s => s.id === currentSessionUser?.id) || students[0];
    return { status: 200, data: { student } };
  }

  if (url === '/api/students/profile' && method === 'PUT') {
    students = students.map(s => s.id === currentSessionUser.id ? { ...s, ...body } : s);
    const updated = students.find(s => s.id === currentSessionUser.id);
    currentSessionUser = { ...updated, role: 'STUDENT' };
    saveStorage(STORAGE_KEYS.USER, currentSessionUser);
    return { status: 200, data: { student: updated, message: 'Profile updated successfully' } };
  }

  if (url === '/api/students/stats' && method === 'GET') {
    const studentId = currentSessionUser?.id || 'std-1';
    const myApps = applications.filter(a => a.studentId === studentId);
    const shortlistedCount = myApps.filter(a => a.status === 'SHORTLISTED').length;
    const selectedCount = myApps.filter(a => a.status === 'SELECTED').length;
    const activeJobsCount = drives.filter(d => d.status === 'ACTIVE').length;

    return {
      status: 200,
      data: {
        availableJobs: activeJobsCount,
        myApplications: myApps.length,
        shortlisted: shortlistedCount,
        selected: selectedCount
      }
    };
  }

  // --- JOBS & ELIGIBILITY ROUTES ---
  if (url === '/api/jobs' && method === 'GET') {
    let result = [...drives];
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter(j => j.title.toLowerCase().includes(q) || j.companyName.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
    }
    if (params.branch && params.branch !== 'ALL') {
      result = result.filter(j => j.allowedBranches.includes(params.branch));
    }
    if (params.jobType && params.jobType !== 'ALL') {
      result = result.filter(j => j.jobType === params.jobType);
    }
    if (params.location && params.location !== 'ALL') {
      result = result.filter(j => j.location.toLowerCase().includes(params.location.toLowerCase()));
    }
    if (params.status && params.status !== 'ALL') {
      result = result.filter(j => j.status === params.status);
    }

    return { status: 200, data: { jobs: result, total: result.length } };
  }

  const jobMatch = url.match(/^\/api\/jobs\/([^/]+)$/);
  if (jobMatch && method === 'GET') {
    const jobId = jobMatch[1];
    const job = drives.find(j => j.id === jobId);
    if (!job) return { status: 404, data: { message: 'Placement drive not found' } };
    return { status: 200, data: { job } };
  }

  const eligibilityMatch = url.match(/^\/api\/jobs\/([^/]+)\/eligibility$/);
  if (eligibilityMatch && method === 'GET') {
    const jobId = eligibilityMatch[1];
    const job = drives.find(j => j.id === jobId);
    if (!job) return { status: 404, data: { message: 'Placement drive not found' } };

    const student = students.find(s => s.id === currentSessionUser?.id) || students[0];

    // Evaluate exact eligibility criteria
    const cgpaPass = student.cgpa >= job.minCgpa;
    const branchPass = job.allowedBranches.includes(student.branch);
    const backlogsPass = student.activeBacklogs <= job.maxBacklogs;
    const batchPass = student.batch === job.eligibleBatch;

    const isEligible = cgpaPass && branchPass && backlogsPass && batchPass;

    const reasons = [];
    if (!cgpaPass) reasons.push(`CGPA requirement not met: minimum ${job.minCgpa} required, your CGPA is ${student.cgpa}.`);
    if (!branchPass) reasons.push(`Branch not eligible: allowed branches are [${job.allowedBranches.join(', ')}], your branch is ${student.branch}.`);
    if (!backlogsPass) reasons.push(`Active backlogs exceed threshold: max allowed is ${job.maxBacklogs}, you have ${student.activeBacklogs}.`);
    if (!batchPass) reasons.push(`Eligible batch is ${job.eligibleBatch}, your batch is ${student.batch}.`);

    const details = {
      cgpa: { student: student.cgpa, required: job.minCgpa, pass: cgpaPass },
      branch: { student: student.branch, allowed: job.allowedBranches, pass: branchPass },
      backlogs: { student: student.activeBacklogs, maxAllowed: job.maxBacklogs, pass: backlogsPass },
      batch: { student: student.batch, required: job.eligibleBatch, pass: batchPass }
    };

    return {
      status: 200,
      data: {
        eligible: isEligible,
        details,
        reasons,
        studentName: student.name,
        rollNumber: student.rollNumber,
        companyName: job.companyName,
        jobTitle: job.title
      }
    };
  }

  if (url === '/api/applications' && method === 'POST') {
    const { jobId } = body;
    const job = drives.find(j => j.id === jobId);
    if (!job) return { status: 404, data: { message: 'Placement drive not found' } };

      const student = students.find(s => s.id === currentSessionUser?.id) || students[0];

    // Check duplicate
    const existing = applications.find(a => a.jobId === jobId && a.studentId === student.id);
    if (existing) {
      return { status: 400, data: { message: 'You have already applied for this placement drive.' } };
    }

    // Server-side strict eligibility enforcement
    const cgpaPass = student.cgpa >= job.minCgpa;
    const branchPass = job.allowedBranches.includes(student.branch);
    const backlogsPass = student.activeBacklogs <= job.maxBacklogs;
    const batchPass = student.batch === job.eligibleBatch;

    if (!cgpaPass || !branchPass || !backlogsPass || !batchPass) {
      return { status: 403, data: { message: 'You are not eligible for this placement drive based on academic criteria.' } };
    }

    // Compute resume match score
    const studentSkills = student.resume?.skills || [];
    const matched = job.requiredSkills.filter(s => studentSkills.some(sk => sk.toLowerCase() === s.toLowerCase()));
    const missing = job.requiredSkills.filter(s => !matched.includes(s));
    const score = job.requiredSkills.length > 0 ? Math.round((matched.length / job.requiredSkills.length) * 100) : 75;

    const newApp = {
      id: `app-${Date.now()}`,
      jobId,
      studentId: student.id,
      appliedOn: new Date().toISOString(),
      status: 'APPLIED',
      matchScore: score,
      matchedSkills: matched,
      missingSkills: missing,
      timeline: [
        { status: 'APPLIED', timestamp: new Date().toISOString(), note: 'Application submitted successfully.' }
      ],
      eligibilitySnapshot: {
        cgpa: { student: student.cgpa, required: job.minCgpa, pass: true },
        branch: { student: student.branch, allowed: job.allowedBranches, pass: true },
        backlogs: { student: student.activeBacklogs, maxAllowed: job.maxBacklogs, pass: true },
        batch: { student: student.batch, required: job.eligibleBatch, pass: true }
      }
    };

    applications.unshift(newApp);
    saveStorage(STORAGE_KEYS.APPLICATIONS, applications);

    // Audit log
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${student.email} (${student.name})`,
      action: 'JOB_APPLICATION_SUBMITTED',
      details: `Applied for ${job.title} at ${job.companyName}.`
    });
    saveStorage(STORAGE_KEYS.AUDIT, auditLogs);

    return { status: 201, data: { application: newApp, message: 'Application submitted successfully.' } };
  }

  if (url === '/api/applications/my' && method === 'GET') {
    const studentId = currentSessionUser?.id || 'std-1';
    const myApps = applications
      .filter(a => a.studentId === studentId)
      .map(a => {
        const job = drives.find(j => j.id === a.jobId) || {};
        return {
          ...a,
          jobTitle: job.title || 'Software Engineer',
          companyName: job.companyName || 'Campus Recruiter',
          location: job.location || 'NCR',
          salaryRange: job.salaryRange || '₹6–8 LPA'
        };
      });
    return { status: 200, data: { applications: myApps } };
  }

  const appDetailMatch = url.match(/^\/api\/applications\/([^/]+)$/);
  if (appDetailMatch && method === 'GET') {
    const appId = appDetailMatch[1];
    const app = applications.find(a => a.id === appId);
    if (!app) return { status: 404, data: { message: 'Application not found' } };

    const job = drives.find(j => j.id === app.jobId) || {};
    const student = students.find(s => s.id === app.studentId) || {};

    return {
      status: 200,
      data: {
        application: {
          ...app,
          job,
          studentName: student.name,
          rollNumber: student.rollNumber,
          branch: student.branch,
          cgpa: student.cgpa
        }
      }
    };
  }

  // --- RESUME ROUTES ---
  if (url === '/api/resumes' && method === 'GET') {
    const student = students.find(s => s.id === currentSessionUser?.id) || students[0];
    return { status: 200, data: { resume: student.resume } };
  }

  if (url === '/api/resumes/upload' && method === 'POST') {
    const studentId = currentSessionUser?.id || 'std-1';
    const newResume = {
      fileName: body.fileName || 'Updated_Student_Resume.pdf',
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: body.fileSize || '1.2 MB',
      skills: body.skills || ['React', 'Node.js', 'Express', 'JavaScript', 'SQL', 'Git', 'Data Structures']
    };
    students = students.map(s => s.id === studentId ? { ...s, resume: newResume } : s);
    saveStorage(STORAGE_KEYS.STUDENTS, students);
    return { status: 200, data: { resume: newResume, message: 'Resume uploaded successfully' } };
  }

  if (url === '/api/resumes' && method === 'DELETE') {
    const studentId = currentSessionUser?.id || 'std-1';
    students = students.map(s => s.id === studentId ? { ...s, resume: null } : s);
    saveStorage(STORAGE_KEYS.STUDENTS, students);
    return { status: 200, data: { message: 'Resume deleted successfully' } };
  }

  if (url === '/api/resumes/match' && method === 'POST') {
    const { jobId, customSkills } = body;
    const job = drives.find(j => j.id === jobId) || drives[0];
    const student = students.find(s => s.id === currentSessionUser?.id) || students[0];

    const studentSkills = customSkills || student.resume?.skills || ['React', 'Node.js', 'Express', 'SQL', 'Git'];
    const matched = job.requiredSkills.filter(req => studentSkills.some(sk => sk.toLowerCase().trim() === req.toLowerCase().trim()));
    const missing = job.requiredSkills.filter(req => !matched.some(m => m.toLowerCase().trim() === req.toLowerCase().trim()));
    const matchScore = job.requiredSkills.length > 0 ? Math.round((matched.length / job.requiredSkills.length) * 100) : 80;

    return {
      status: 200,
      data: {
        matchScore,
        matchedSkills: matched,
        missingSkills: missing,
        targetJob: {
          id: job.id,
          title: job.title,
          companyName: job.companyName,
          requiredSkills: job.requiredSkills
        },
        disclaimer: 'These suggestions are based on keyword matching and are not a hiring decision.'
      }
    };
  }

  // --- T&P ADMIN ROUTES ---
  if (url === '/api/admin/stats' && method === 'GET') {
    const totalStudents = students.length;
    const activeCompanies = companies.filter(c => c.verified).length;
    const activeDrives = drives.filter(d => d.status === 'ACTIVE').length;
    const totalApps = applications.length;
    const shortlistedCount = applications.filter(a => a.status === 'SHORTLISTED').length;
    const selectedCount = applications.filter(a => a.status === 'SELECTED').length;

    // Applications by branch breakdown
    const branchCounts = {};
    students.forEach(s => {
      branchCounts[s.branch] = (branchCounts[s.branch] || 0) + applications.filter(a => a.studentId === s.id).length;
    });

    const statusCounts = {
      APPLIED: applications.filter(a => a.status === 'APPLIED').length,
      SHORTLISTED: shortlistedCount,
      SELECTED: selectedCount,
      REJECTED: applications.filter(a => a.status === 'REJECTED').length
    };

    return {
      status: 200,
      data: {
        totalStudents: 480 + totalStudents, // realistic university cohort scale
        activeCompanies: 38 + activeCompanies,
        activeDrives: drives.length,
        totalApplications: 620 + totalApps,
        shortlisted: 142 + shortlistedCount,
        selected: 88 + selectedCount,
        branchStats: [
          { branch: 'CSE', applications: 280, offers: 74 },
          { branch: 'IT', applications: 195, offers: 52 },
          { branch: 'ECE', applications: 165, offers: 41 },
          { branch: 'ME', applications: 110, offers: 25 },
          { branch: 'Civil', applications: 85, offers: 16 },
          { branch: 'Biotech', applications: 45, offers: 9 }
        ],
        statusStats: statusCounts,
        recentDrives: drives.slice(0, 5),
        recentApplications: applications.slice(0, 5).map(a => {
          const s = students.find(st => st.id === a.studentId);
          const j = drives.find(dr => dr.id === a.jobId);
          return {
            ...a,
            studentName: s?.name || 'Student',
            rollNumber: s?.rollNumber || 'N/A',
            branch: s?.branch || 'N/A',
            companyName: j?.companyName || 'Company',
            jobTitle: j?.title || 'Role'
          };
        })
      }
    };
  }

  if (url === '/api/admin/students' && method === 'GET') {
    let list = [...students];
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.rollNumber.includes(q) || s.email.toLowerCase().includes(q));
    }
    if (params.branch && params.branch !== 'ALL') {
      list = list.filter(s => s.branch === params.branch);
    }
    if (params.batch && params.batch !== 'ALL') {
      list = list.filter(s => String(s.batch) === String(params.batch));
    }
    if (params.minCgpa) {
      list = list.filter(s => s.cgpa >= parseFloat(params.minCgpa));
    }

    // Mask phone numbers for student privacy policy compliance
    const safeList = list.map(s => ({
      ...s,
      phone: maskPhoneNumber(s.phone)
    }));

    return { status: 200, data: { students: safeList, total: safeList.length } };
  }

  if (url === '/api/admin/companies' && method === 'GET') {
    return { status: 200, data: { companies } };
  }

  const compVerifyMatch = url.match(/^\/api\/admin\/companies\/([^/]+)\/verify$/);
  if (compVerifyMatch && method === 'PATCH') {
    const compId = compVerifyMatch[1];
    companies = companies.map(c => c.id === compId ? { ...c, verified: !c.verified } : c);
    saveStorage(STORAGE_KEYS.COMPANIES, companies);
    return { status: 200, data: { message: 'Company status updated', companies } };
  }

  if (url === '/api/admin/jobs' && method === 'GET') {
    return { status: 200, data: { drives } };
  }

  if (url === '/api/admin/jobs' && method === 'POST') {
    const newDrive = {
      id: `job-${Date.now()}`,
      status: 'ACTIVE',
      ...body
    };
    drives.unshift(newDrive);
    saveStorage(STORAGE_KEYS.DRIVES, drives);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentSessionUser?.email || 'admin@dcrust.ac.in'} (T&P Admin)`,
      action: 'NEW_JOB_DRIVE_CREATED',
      details: `Created placement drive for ${newDrive.title} (${newDrive.companyName}).`
    });
    saveStorage(STORAGE_KEYS.AUDIT, auditLogs);

    // Broadcast new drive event
    broadcastMockSocket('drive:new', {
      title: newDrive.title,
      companyName: newDrive.companyName,
      salaryRange: newDrive.salaryRange
    });

    return { status: 201, data: { drive: newDrive, message: 'Placement drive created successfully' } };
  }

  if (url === '/api/admin/applications' && method === 'GET') {
    const enhanced = applications.map(a => {
      const s = students.find(st => st.id === a.studentId);
      const j = drives.find(dr => dr.id === a.jobId);
      return {
        ...a,
        studentName: s?.name || 'Student',
        rollNumber: s?.rollNumber || 'N/A',
        branch: s?.branch || 'N/A',
        cgpa: s?.cgpa || 0,
        phone: maskPhoneNumber(s?.phone),
        companyName: j?.companyName || 'Company',
        jobTitle: j?.title || 'Job'
      };
    });
    return { status: 200, data: { applications: enhanced } };
  }

  if (url === '/api/admin/exports/csv' && method === 'GET') {
    // Generate CSV data based on params
    const headers = ['Application ID', 'Roll Number', 'Student Name', 'Branch', 'Batch', 'CGPA', 'Company', 'Job Title', 'Status', 'Applied Date'];
    const rows = applications.map(a => {
      const s = students.find(st => st.id === a.studentId);
      const j = drives.find(dr => dr.id === a.jobId);
      return [
        a.id,
        s?.rollNumber || '',
        `"${s?.name || ''}"`,
        s?.branch || '',
        s?.batch || '',
        s?.cgpa || '',
        `"${j?.companyName || ''}"`,
        `"${j?.title || ''}"`,
        a.status,
        a.appliedOn.split('T')[0]
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    return {
      status: 200,
      data: {
        csv: csvContent,
        filename: `DCRUST_Placements_Export_${new Date().toISOString().slice(0, 10)}.csv`
      }
    };
  }

  if (url === '/api/admin/audit' && method === 'GET') {
    return { status: 200, data: { auditLogs } };
  }

  // --- COMPANY / RECRUITER ROUTES ---
  if (url === '/api/companies/stats' && method === 'GET') {
    const compDrives = drives.filter(d => d.companyId === 'comp-1' || d.companyName.includes('ABC'));
    const compDriveIds = compDrives.map(d => d.id);
    const compApps = applications.filter(a => compDriveIds.includes(a.jobId));

    return {
      status: 200,
      data: {
        activeDrives: compDrives.length,
        totalApplicants: compApps.length,
        eligibleCandidates: compApps.length,
        shortlisted: compApps.filter(a => a.status === 'SHORTLISTED').length,
        selected: compApps.filter(a => a.status === 'SELECTED').length,
        recentApplicants: compApps.slice(0, 5).map(a => {
          const s = students.find(st => st.id === a.studentId);
          const j = drives.find(dr => dr.id === a.jobId);
          const isShortlistedOrSelected = a.status === 'SHORTLISTED' || a.status === 'SELECTED';
          return {
            ...a,
            studentName: s?.name,
            rollNumber: s?.rollNumber,
            branch: s?.branch,
            cgpa: s?.cgpa,
            phone: isShortlistedOrSelected ? s?.phone : maskPhoneNumber(s?.phone),
            jobTitle: j?.title
          };
        })
      }
    };
  }

  if (url === '/api/companies/drives' && method === 'GET') {
    const compDrives = drives.filter(d => d.companyId === 'comp-1' || d.companyName.includes('ABC'));
    return { status: 200, data: { drives: compDrives } };
  }

  if (url === '/api/companies/applicants' && method === 'GET') {
    const compDrives = drives.filter(d => d.companyId === 'comp-1' || d.companyName.includes('ABC'));
    const compDriveIds = compDrives.map(d => d.id);
    let compApps = applications.filter(a => compDriveIds.includes(a.jobId));

    if (params.status && params.status !== 'ALL') {
      compApps = compApps.filter(a => a.status === params.status);
    }

    const enriched = compApps.map(a => {
      const s = students.find(st => st.id === a.studentId);
      const j = drives.find(dr => dr.id === a.jobId);
      const isAuthorized = a.status === 'SHORTLISTED' || a.status === 'SELECTED';

      return {
        ...a,
        studentName: s?.name || 'Student Candidate',
        rollNumber: s?.rollNumber || 'N/A',
        branch: s?.branch || 'N/A',
        cgpa: s?.cgpa || 0,
        activeBacklogs: s?.activeBacklogs || 0,
        // STRICT PRIVACY: Frontend only receives masked phone unless authorized after shortlisting
        phone: isAuthorized ? s?.phone : maskPhoneNumber(s?.phone),
        email: isAuthorized ? s?.email : `${s?.rollNumber}@dcrust.ac.in`,
        resumeSkills: s?.resume?.skills || [],
        jobTitle: j?.title || 'Drive Position'
      };
    });

    return { status: 200, data: { applicants: enriched } };
  }

  const shortlistMatch = url.match(/^\/api\/companies\/applications\/([^/]+)\/shortlist$/);
  if (shortlistMatch && method === 'POST') {
    const appId = shortlistMatch[1];
    const app = applications.find(a => a.id === appId);
    if (!app) return { status: 404, data: { message: 'Application not found' } };

    app.status = 'SHORTLISTED';
    app.timeline.push({
      status: 'SHORTLISTED',
      timestamp: new Date().toISOString(),
      note: 'Shortlisted by recruiter for next interview round.'
    });
    saveStorage(STORAGE_KEYS.APPLICATIONS, applications);

    const s = students.find(st => st.id === app.studentId);
    const j = drives.find(dr => dr.id === app.jobId);

    // Create notification for the student
    const notif = {
      id: `notif-${Date.now()}`,
      recipientId: app.studentId,
      title: 'Application Shortlisted!',
      message: `Your application for ${j?.title || 'Software Engineer'} at ${j?.companyName || 'ABC Technologies'} has been shortlisted.`,
      timestamp: new Date().toISOString(),
      read: false,
      link: `/student/applications/${app.id}`
    };
    notifications.unshift(notif);
    saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    // Log audit
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentSessionUser?.email || 'recruiter@tcs.com'} (Company Recruiter)`,
      action: 'CANDIDATE_SHORTLISTED',
      details: `Shortlisted applicant ${s?.name} (${s?.rollNumber}) for ${j?.title}.`
    });
    saveStorage(STORAGE_KEYS.AUDIT, auditLogs);

    // Broadcast live Socket.IO update
    broadcastMockSocket('application:status-updated', {
      applicationId: app.id,
      studentId: app.studentId,
      status: 'SHORTLISTED',
      companyName: j?.companyName,
      jobTitle: j?.title,
      message: `Your application for ${j?.title} at ${j?.companyName} has been shortlisted.`
    });

    return { status: 200, data: { application: app, message: 'Applicant shortlisted successfully.' } };
  }

  const rejectMatch = url.match(/^\/api\/companies\/applications\/([^/]+)\/reject$/);
  if (rejectMatch && method === 'POST') {
    const appId = rejectMatch[1];
    const app = applications.find(a => a.id === appId);
    if (!app) return { status: 404, data: { message: 'Application not found' } };

    app.status = 'REJECTED';
    app.rejectionReason = body.reason || 'Candidate profile not aligned with current requirements.';
    app.timeline.push({
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
      note: app.rejectionReason
    });
    saveStorage(STORAGE_KEYS.APPLICATIONS, applications);

    const s = students.find(st => st.id === app.studentId);
    const j = drives.find(dr => dr.id === app.jobId);

    // Create notification for student
    const notif = {
      id: `notif-${Date.now()}`,
      recipientId: app.studentId,
      title: 'Application Status Update',
      message: `Update on your application for ${j?.title || 'Job'} at ${j?.companyName || 'Company'}.`,
      timestamp: new Date().toISOString(),
      read: false,
      link: `/student/applications/${app.id}`
    };
    notifications.unshift(notif);
    saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);

    // Audit log
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentSessionUser?.email || 'recruiter@tcs.com'} (Company Recruiter)`,
      action: 'CANDIDATE_REJECTED',
      details: `Application ${app.id} marked as rejected. Reason: ${app.rejectionReason}`
    });
    saveStorage(STORAGE_KEYS.AUDIT, auditLogs);

    broadcastMockSocket('application:status-updated', {
      applicationId: app.id,
      studentId: app.studentId,
      status: 'REJECTED',
      companyName: j?.companyName,
      jobTitle: j?.title,
      message: `Your application for ${j?.title} at ${j?.companyName} has been updated.`
    });

    return { status: 200, data: { application: app, message: 'Application status updated.' } };
  }

  if (url === '/api/companies/profile' && method === 'GET') {
    const comp = companies[0];
    return { status: 200, data: { company: comp } };
  }

  if (url === '/api/companies/profile' && method === 'PUT') {
    companies = companies.map(c => c.id === 'comp-1' ? { ...c, ...body } : c);
    saveStorage(STORAGE_KEYS.COMPANIES, companies);
    return { status: 200, data: { company: companies[0], message: 'Company profile updated.' } };
  }

  // --- NOTIFICATIONS ROUTES ---
  if (url === '/api/notifications' && method === 'GET') {
    const userId = currentSessionUser?.id || 'std-1';
    const userNotifs = notifications.filter(n => !n.recipientId || n.recipientId === userId);
    return { status: 200, data: { notifications: userNotifs } };
  }

  const markReadMatch = url.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (markReadMatch && method === 'PATCH') {
    const notifId = markReadMatch[1];
    notifications = notifications.map(n => n.id === notifId ? { ...n, read: true } : n);
    saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return { status: 200, data: { success: true } };
  }

  if (url === '/api/notifications/read-all' && method === 'PATCH') {
    const userId = currentSessionUser?.id || 'std-1';
    notifications = notifications.map(n => (!n.recipientId || n.recipientId === userId) ? { ...n, read: true } : n);
    saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return { status: 200, data: { success: true } };
  }

  // Fallback 404
  return { status: 404, data: { message: `Route ${method} ${url} not found in mock router` } };
}
