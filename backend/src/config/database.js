import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import env from './env.js';
import logger from './logger.js';

// Seed dataset for in-memory / testing / offline fallback
export const initialSeedData = {
  users: [
    {
      id: 'usr-admin-1',
      name: 'Dr. S. K. Garg',
      email: 'admin@dcrust.edu.in',
      passwordHash: bcrypt.hashSync('Admin@123', 10),
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-comp-1',
      name: 'Rajesh Mittal',
      email: 'recruiter@tcs.com',
      passwordHash: bcrypt.hashSync('Recruiter@123', 10),
      role: 'COMPANY',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-std-1',
      name: 'Rahul Sharma',
      email: 'student@dcrust.ac.in',
      passwordHash: bcrypt.hashSync('Student@123', 10),
      role: 'STUDENT',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-std-2',
      name: 'Priya Verma',
      email: 'priya@dcrust.ac.in',
      passwordHash: bcrypt.hashSync('Student@123', 10),
      role: 'STUDENT',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2026-01-16'),
      updatedAt: new Date(),
    },
    {
      id: 'usr-std-3',
      name: 'Aman Malik',
      email: 'aman@dcrust.ac.in',
      passwordHash: bcrypt.hashSync('Student@123', 10),
      role: 'STUDENT',
      isActive: true,
      lastLoginAt: new Date(),
      createdAt: new Date('2026-01-17'),
      updatedAt: new Date(),
    }
  ],
  students: [
    {
      id: 'std-1',
      userId: 'usr-std-1',
      rollNumber: '21001001045',
      registrationNumber: '21DCRUST045',
      fullName: 'Rahul Sharma',
      branch: 'CSE',
      batch: 2025,
      semester: 7,
      cgpa: 8.2,
      activeBacklogs: 0,
      phone: '+91 9876543210',
      graduationYear: 2025,
      profileComplete: true,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date(),
    },
    {
      id: 'std-2',
      userId: 'usr-std-2',
      rollNumber: '21001002018',
      registrationNumber: '21DCRUST118',
      fullName: 'Priya Verma',
      branch: 'ECE',
      batch: 2025,
      semester: 7,
      cgpa: 6.4,
      activeBacklogs: 1,
      phone: '+91 9812345678',
      graduationYear: 2025,
      profileComplete: true,
      createdAt: new Date('2026-01-16'),
      updatedAt: new Date(),
    },
    {
      id: 'std-3',
      userId: 'usr-std-3',
      rollNumber: '22001003009',
      registrationNumber: '22DCRUST209',
      fullName: 'Aman Malik',
      branch: 'MECHANICAL',
      batch: 2026,
      semester: 5,
      cgpa: 7.5,
      activeBacklogs: 0,
      phone: '+91 9898989898',
      graduationYear: 2026,
      profileComplete: false,
      createdAt: new Date('2026-01-17'),
      updatedAt: new Date(),
    }
  ],
  companies: [
    {
      id: 'comp-1',
      userId: 'usr-comp-1',
      companyName: 'ABC Technologies',
      companyEmail: 'recruiter@tcs.com',
      industry: 'Information Technology & Software Services',
      website: 'https://abctech.example.com',
      description: 'Leading global enterprise technology and IT consulting organization.',
      verified: true,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date(),
    }
  ],
  jobDrives: [
    {
      id: 'job-1',
      companyId: 'comp-1',
      title: 'Associate Software Engineer - Campus Drive 2026',
      description: 'Full stack development role working on enterprise cloud systems with React, Node.js, Express, and PostgreSQL.',
      jobType: 'Full-time',
      location: 'Gurugram / Noida (Hybrid)',
      salaryMin: 700000,
      salaryMax: 1000000,
      minCgpa: 7.0,
      maxBacklogs: 0,
      applicationStart: new Date('2026-01-01'),
      applicationEnd: new Date('2026-12-31'),
      status: 'ACTIVE',
      createdAt: new Date('2026-01-12'),
      updatedAt: new Date(),
    }
  ],
  jobBranches: [
    { id: 'jb-1', jobId: 'job-1', branch: 'CSE' },
    { id: 'jb-2', jobId: 'job-1', branch: 'ECE' },
    { id: 'jb-3', jobId: 'job-1', branch: 'IT' },
  ],
  jobSkills: [
    { id: 'js-1', jobId: 'job-1', skill: 'React' },
    { id: 'js-2', jobId: 'job-1', skill: 'Node.js' },
    { id: 'js-3', jobId: 'job-1', skill: 'Express' },
    { id: 'js-4', jobId: 'job-1', skill: 'PostgreSQL' },
    { id: 'js-5', jobId: 'job-1', skill: 'Docker' },
    { id: 'js-6', jobId: 'job-1', skill: 'Git' },
  ],
  applications: [],
  consents: [
    {
      id: 'cns-1',
      studentId: 'std-1',
      consentType: 'PLACEMENT_POLICY',
      version: 'V2',
      accepted: true,
      acceptedAt: new Date('2026-01-15'),
      withdrawnAt: null,
      createdAt: new Date('2026-01-15'),
    },
    {
      id: 'cns-2',
      studentId: 'std-2',
      consentType: 'PLACEMENT_POLICY',
      version: 'V2',
      accepted: true,
      acceptedAt: new Date('2026-01-16'),
      withdrawnAt: null,
      createdAt: new Date('2026-01-16'),
    }
  ],
  auditLogs: [],
  notifications: [],
  resumes: [
    {
      id: 'res-1',
      studentId: 'std-1',
      fileName: 'Rahul_Sharma_CSE_Resume.pdf',
      storageKey: 'resumes/std-1/rahul_resume.pdf',
      mimeType: 'application/pdf',
      fileSize: 1468006,
      skills: ['React', 'Node.js', 'Express', 'JavaScript', 'SQL', 'Git', 'Data Structures'],
      createdAt: new Date('2026-01-16'),
      updatedAt: new Date(),
    }
  ],
  resumeMatches: [],
};

// In-memory store used by tests and when MongoDB is unavailable locally.
class InMemoryStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.data.users.forEach(u => {
      u.createdAt = new Date(u.createdAt);
      u.updatedAt = new Date(u.updatedAt);
      if (u.lastLoginAt) u.lastLoginAt = new Date(u.lastLoginAt);
    });
    this.data.students.forEach(s => {
      s.createdAt = new Date(s.createdAt);
      s.updatedAt = new Date(s.updatedAt);
    });
    this.data.companies.forEach(c => {
      c.createdAt = new Date(c.createdAt);
      c.updatedAt = new Date(c.updatedAt);
    });
    this.data.jobDrives.forEach(j => {
      j.applicationStart = new Date(j.applicationStart);
      j.applicationEnd = new Date(j.applicationEnd);
      j.createdAt = new Date(j.createdAt);
      j.updatedAt = new Date(j.updatedAt);
    });
  }

  get user() {
    return {
      findUnique: async ({ where, include, includePasswordHash }) => {
        let u = null;
        if (where.id) u = this.data.users.find(x => x.id === where.id);
        if (where.email) u = this.data.users.find(x => x.email.toLowerCase() === where.email.toLowerCase());
        if (!u) return null;
        const res = { ...u };
        if (include?.student) res.student = this.data.students.find(s => s.userId === u.id) || null;
        if (include?.company) res.company = this.data.companies.find(c => c.userId === u.id) || null;
        if (includePasswordHash === true) return res;
        const { passwordHash, ...safeUser } = res;
        return safeUser;
      },
      findMany: async (args = {}) => {
        return this.data.users.map(u => {
          const { passwordHash, ...res } = u;
          if (args.include?.student) res.student = this.data.students.find(s => s.userId === u.id) || null;
          if (args.include?.company) res.company = this.data.companies.find(c => c.userId === u.id) || null;
          return res;
        });
      },
      create: async ({ data }) => {
        const id = data.id || `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const user = {
          id,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          isActive: data.isActive ?? true,
          lastLoginAt: data.lastLoginAt || new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.users.push(user);
        return user;
      },
      update: async ({ where, data }) => {
        const u = this.data.users.find(x => x.id === where.id || x.email === where.email);
        if (!u) throw new Error('User not found');
        Object.assign(u, data, { updatedAt: new Date() });
        return { ...u };
      },
      count: async () => this.data.users.length,
    };
  }

  get student() {
    return {
      findUnique: async ({ where, include }) => {
        let s = null;
        if (where.id) s = this.data.students.find(x => x.id === where.id);
        if (where.userId) s = this.data.students.find(x => x.userId === where.userId);
        if (where.rollNumber) s = this.data.students.find(x => x.rollNumber === where.rollNumber);
        if (!s) return null;
        const res = { ...s };
        if (include?.user) {
          const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === s.userId) || {};
          res.user = safeUser.id ? safeUser : null;
        }
        if (include?.resumes) res.resumes = this.data.resumes.filter(r => r.studentId === s.id);
        if (include?.applications) res.applications = this.data.applications.filter(a => a.studentId === s.id);
        if (include?.consents) res.consents = this.data.consents.filter(c => c.studentId === s.id);
        return res;
      },
      findMany: async (args = {}) => {
        let list = [...this.data.students];
        if (args.where?.branch) list = list.filter(s => s.branch.toUpperCase() === args.where.branch.toUpperCase());
        if (args.where?.batch) list = list.filter(s => s.batch === args.where.batch);
        return list.map(s => {
          const res = { ...s };
          if (args.include?.user) {
            const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === s.userId) || {};
            res.user = safeUser.id ? safeUser : null;
          }
          if (args.include?.resumes) res.resumes = this.data.resumes.filter(r => r.studentId === s.id);
          return res;
        });
      },
      create: async ({ data }) => {
        const id = data.id || `std-${Date.now()}`;
        const student = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.students.push(student);
        return student;
      },
      update: async ({ where, data }) => {
        const s = this.data.students.find(x => x.id === where.id || x.userId === where.userId);
        if (!s) throw new Error('Student not found');
        Object.assign(s, data, { updatedAt: new Date() });
        return s;
      },
      count: async () => this.data.students.length,
    };
  }

  get company() {
    return {
      findUnique: async ({ where, include }) => {
        let c = null;
        if (where.id) c = this.data.companies.find(x => x.id === where.id);
        if (where.userId) c = this.data.companies.find(x => x.userId === where.userId);
        if (!c) return null;
        const res = { ...c };
        if (include?.user) {
          const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === c.userId) || {};
          res.user = safeUser.id ? safeUser : null;
        }
        if (include?.jobDrives) res.jobDrives = this.data.jobDrives.filter(j => j.companyId === c.id);
        return res;
      },
      findMany: async (args = {}) => {
        return this.data.companies.map(c => {
          const res = { ...c };
          if (args.include?.user) {
            const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === c.userId) || {};
            res.user = safeUser.id ? safeUser : null;
          }
          if (args.include?.jobDrives) res.jobDrives = this.data.jobDrives.filter(j => j.companyId === c.id);
          return res;
        });
      },
      create: async ({ data }) => {
        const id = data.id || `comp-${Date.now()}`;
        const company = {
          id,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.companies.push(company);
        return company;
      },
      update: async ({ where, data }) => {
        const c = this.data.companies.find(x => x.id === where.id || x.userId === where.userId);
        if (!c) throw new Error('Company not found');
        Object.assign(c, data, { updatedAt: new Date() });
        return c;
      },
      count: async () => this.data.companies.length,
    };
  }

  get jobDrive() {
    return {
      findUnique: async ({ where, include }) => {
        const j = this.data.jobDrives.find(x => x.id === where.id);
        if (!j) return null;
        const res = { ...j };
        if (include?.company) res.company = this.data.companies.find(c => c.id === j.companyId);
        if (include?.branches) res.branches = this.data.jobBranches.filter(b => b.jobId === j.id);
        if (include?.skills) res.skills = this.data.jobSkills.filter(s => s.jobId === j.id);
        if (include?.applications) res.applications = this.data.applications.filter(a => a.jobId === j.id);
        return res;
      },
      findMany: async (args = {}) => {
        let list = [...this.data.jobDrives];
        if (args.where?.status) list = list.filter(j => j.status === args.where.status);
        if (args.where?.companyId) list = list.filter(j => j.companyId === args.where.companyId);
        return list.map(j => {
          const res = { ...j };
          if (args.include?.company) res.company = this.data.companies.find(c => c.id === j.companyId);
          if (args.include?.branches) res.branches = this.data.jobBranches.filter(b => b.jobId === j.id);
          if (args.include?.skills) res.skills = this.data.jobSkills.filter(s => s.jobId === j.id);
          return res;
        });
      },
      create: async ({ data }) => {
        const id = data.id || `job-${Date.now()}`;
        const job = {
          id,
          companyId: data.companyId,
          title: data.title,
          description: data.description,
          jobType: data.jobType || 'Full-time',
          location: data.location,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          minCgpa: data.minCgpa,
          maxBacklogs: data.maxBacklogs ?? 0,
          applicationStart: new Date(data.applicationStart),
          applicationEnd: new Date(data.applicationEnd),
          status: data.status || 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.jobDrives.push(job);

        if (data.branches?.create) {
          data.branches.create.forEach(b => {
            this.data.jobBranches.push({ id: `jb-${Date.now()}-${Math.random()}`, jobId: id, branch: b.branch });
          });
        }
        if (data.skills?.create) {
          data.skills.create.forEach(s => {
            this.data.jobSkills.push({ id: `js-${Date.now()}-${Math.random()}`, jobId: id, skill: s.skill });
          });
        }

        return this.jobDrive.findUnique({ where: { id }, include: { branches: true, skills: true } });
      },
      update: async ({ where, data }) => {
        const j = this.data.jobDrives.find(x => x.id === where.id);
        if (!j) throw new Error('Job drive not found');
        Object.assign(j, data, { updatedAt: new Date() });
        return this.jobDrive.findUnique({ where: { id: where.id }, include: { branches: true, skills: true } });
      },
      count: async (args = {}) => {
        let list = [...this.data.jobDrives];
        if (args.where?.status) list = list.filter(j => j.status === args.where.status);
        return list.length;
      },
    };
  }

  get application() {
    return {
      findUnique: async ({ where, include }) => {
        let a = null;
        if (where.id) a = this.data.applications.find(x => x.id === where.id);
        if (where.studentId_jobId) {
          a = this.data.applications.find(
            x => x.studentId === where.studentId_jobId.studentId && x.jobId === where.studentId_jobId.jobId
          );
        }
        if (!a) return null;
        const res = { ...a };
        if (include?.student) {
          res.student = this.data.students.find(s => s.id === a.studentId);
          if (include.student.include?.user && res.student) {
            const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === res.student.userId) || {};
            res.student.user = safeUser.id ? safeUser : null;
          }
        }
        if (include?.job) {
          res.job = this.data.jobDrives.find(j => j.id === a.jobId);
          if (include.job.include?.company && res.job) {
            res.job.company = this.data.companies.find(c => c.id === res.job.companyId);
          }
        }
        return res;
      },
      findMany: async (args = {}) => {
        let list = [...this.data.applications];
        if (args.where?.studentId) list = list.filter(a => a.studentId === args.where.studentId);
        if (args.where?.jobId) list = list.filter(a => a.jobId === args.where.jobId);
        if (args.where?.status) list = list.filter(a => a.status === args.where.status);

        return list.map(a => {
          const res = { ...a };
          if (args.include?.student) {
            res.student = this.data.students.find(s => s.id === a.studentId);
            if (args.include.student.include?.user && res.student) {
              const { passwordHash, ...safeUser } = this.data.users.find(u => u.id === res.student.userId) || {};
              res.student.user = safeUser.id ? safeUser : null;
            }
          }
          if (args.include?.job) {
            res.job = this.data.jobDrives.find(j => j.id === a.jobId);
            if (args.include.job.include?.company && res.job) {
              res.job.company = this.data.companies.find(c => c.id === res.job.companyId);
            }
          }
          return res;
        });
      },
      create: async ({ data }) => {
        const duplicate = this.data.applications.find(
          a => a.studentId === data.studentId && a.jobId === data.jobId
        );
        if (duplicate) {
          const err = new Error('Unique constraint failed on the fields: (`studentId`,`jobId`)');
          err.code = 'P2002';
          throw err;
        }

        const id = data.id || `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const application = {
          id,
          studentId: data.studentId,
          jobId: data.jobId,
          status: data.status || 'APPLIED',
          eligibilitySnapshot: data.eligibilitySnapshot,
          resumeId: data.resumeId || null,
          matchScore: data.matchScore ?? null,
          appliedAt: new Date(),
          updatedAt: new Date(),
          shortlistedAt: null,
          rejectedAt: null,
        };
        this.data.applications.push(application);
        return application;
      },
      update: async ({ where, data }) => {
        const a = this.data.applications.find(x => x.id === where.id);
        if (!a) throw new Error('Application not found');
        Object.assign(a, data, { updatedAt: new Date() });
        return a;
      },
      count: async (args = {}) => {
        let list = [...this.data.applications];
        if (args.where?.status) list = list.filter(a => a.status === args.where.status);
        if (args.where?.jobId) list = list.filter(a => a.jobId === args.where.jobId);
        return list.length;
      },
    };
  }

  get consent() {
    return {
      findFirst: async ({ where }) => {
        let list = [...this.data.consents];
        if (where?.studentId) list = list.filter(c => c.studentId === where.studentId);
        if (where?.accepted !== undefined) list = list.filter(c => c.accepted === where.accepted);
        return list[list.length - 1] || null;
      },
      findMany: async ({ where }) => {
        let list = [...this.data.consents];
        if (where?.studentId) list = list.filter(c => c.studentId === where.studentId);
        return list;
      },
      create: async ({ data }) => {
        const id = data.id || `cns-${Date.now()}`;
        const consent = {
          id,
          studentId: data.studentId,
          consentType: data.consentType || 'PLACEMENT_POLICY',
          version: data.version || 'V2',
          accepted: data.accepted ?? true,
          acceptedAt: new Date(),
          withdrawnAt: null,
          createdAt: new Date(),
        };
        this.data.consents.push(consent);
        return consent;
      },
      update: async ({ where, data }) => {
        const c = this.data.consents.find(x => x.id === where.id);
        if (!c) throw new Error('Consent not found');
        Object.assign(c, data);
        return c;
      },
    };
  }

  get auditLog() {
    return {
      create: async ({ data }) => {
        const log = {
          id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ...data,
          createdAt: new Date(),
        };
        this.data.auditLogs.unshift(log);
        return log;
      },
      findMany: async (args = {}) => {
        let list = [...this.data.auditLogs];
        if (args.where?.userId) list = list.filter(l => l.userId === args.where.userId);
        if (args.where?.action) list = list.filter(l => l.action === args.where.action);
        return list.slice(0, args.take || 100);
      },
    };
  }

  get notification() {
    return {
      create: async ({ data }) => {
        const notif = {
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: data.userId,
          type: data.type || 'INFO',
          title: data.title,
          message: data.message,
          read: data.read ?? false,
          createdAt: new Date(),
        };
        this.data.notifications.unshift(notif);
        return notif;
      },
      findMany: async ({ where }) => {
        let list = [...this.data.notifications];
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        return list;
      },
      update: async ({ where, data }) => {
        const n = this.data.notifications.find(x => x.id === where.id);
        if (!n) throw new Error('Notification not found');
        Object.assign(n, data);
        return n;
      },
      updateMany: async ({ where, data }) => {
        let list = this.data.notifications;
        if (where?.userId) list = list.filter(n => n.userId === where.userId);
        if (where?.read !== undefined) list = list.filter(n => n.read === where.read);
        list.forEach(n => Object.assign(n, data));
        return { count: list.length };
      },
    };
  }

  get resume() {
    return {
      findFirst: async ({ where }) => {
        let list = [...this.data.resumes];
        if (where?.studentId) list = list.filter(r => r.studentId === where.studentId);
        return list[0] || null;
      },
      findUnique: async ({ where }) => {
        return this.data.resumes.find(r => r.id === where.id) || null;
      },
      create: async ({ data }) => {
        const id = data.id || `res-${Date.now()}`;
        const res = {
          id,
          studentId: data.studentId,
          fileName: data.fileName,
          storageKey: data.storageKey,
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          skills: data.skills || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.data.resumes.push(res);
        return res;
      },
      delete: async ({ where }) => {
        const idx = this.data.resumes.findIndex(r => r.id === where.id || r.studentId === where.studentId);
        if (idx !== -1) {
          const removed = this.data.resumes.splice(idx, 1);
          return removed[0];
        }
        return null;
      },
    };
  }

  get resumeMatch() {
    return {
      findFirst: async ({ where }) => {
        return this.data.resumeMatches.find(
          rm => rm.resumeId === where.resumeId && rm.jobId === where.jobId
        ) || null;
      },
      create: async ({ data }) => {
        const rm = {
          id: `rm-${Date.now()}`,
          ...data,
          createdAt: new Date(),
        };
        this.data.resumeMatches.push(rm);
        return rm;
      },
    };
  }

  async $transaction(fn) {
    if (typeof fn === 'function') {
      return fn(this);
    } else if (Array.isArray(fn)) {
      const results = [];
      for (const op of fn) {
        results.push(await op);
      }
      return results;
    }
    return null;
  }
}

export const memoryDb = new InMemoryStore();

let activeDb = memoryDb;

const collections = {
  user: 'users', student: 'students', company: 'companies', jobDrive: 'job_drives',
  jobBranch: 'job_branches', jobSkill: 'job_skills', application: 'applications',
  consent: 'consents', auditLog: 'audit_logs', notification: 'notifications',
  resume: 'resumes', resumeMatch: 'resume_matches',
};

const mongoModels = Object.fromEntries(Object.entries(collections).map(([name, collection]) => {
  const schema = new mongoose.Schema({
    id: { type: String, default: randomUUID, unique: true, index: true },
  }, { collection, strict: false, versionKey: false });
  if (name === 'user') schema.index({ email: 1 }, { unique: true });
  if (name === 'student') {
    schema.index({ userId: 1 }, { unique: true });
    schema.index({ rollNumber: 1 }, { unique: true });
  }
  if (name === 'company') schema.index({ userId: 1 }, { unique: true });
  if (name === 'application') schema.index({ studentId: 1, jobId: 1 }, { unique: true });
  if (name === 'jobBranch') schema.index({ jobId: 1, branch: 1 }, { unique: true });
  if (name === 'jobSkill') schema.index({ jobId: 1, skill: 1 }, { unique: true });
  return [name, mongoose.models[`Dcrust${name}`] || mongoose.model(`Dcrust${name}`, schema)];
}));

const plain = (document) => document ? document.toObject({ versionKey: false }) : null;
const now = () => new Date();

/**
 * MongoDB persistence adapter. It deliberately presents the small repository
 * interface used by the services, keeping all existing routes and API payloads
 * stable while MongoDB stores the data in separate collections.
 */
class MongoStore {
  constructor(models) { this.models = models; }

  normaliseWhere(where = {}) {
    if (where.studentId_jobId) return where.studentId_jobId;
    return where;
  }
  async one(model, where, includePasswordHash = false) {
    const { includePasswordHash: ignoredOption, ...criteria } = where || {};
    const query = this.models[model].findOne(this.normaliseWhere(criteria));
    if (model !== 'user' || !includePasswordHash) query.select('-passwordHash');
    return plain(await query.lean(false));
  }
  async many(model, where = {}) {
    const query = this.models[model].find(where);
    if (model !== 'user') query.select('-passwordHash');
    return (await query.lean(false)).map(plain);
  }
  async addRelations(type, value, include = {}) {
    if (!value) return value;
    if (type === 'user') {
      const { passwordHash, ...safeUser } = value;
      value = safeUser;
    }
    const one = async (key, model, where, nested) => {
      if (include[key]) value[key] = await this.addRelations(model, await this.one(model, where), nested?.include || {});
    };
    const list = async (key, model, where) => { if (include[key]) value[key] = await this.many(model, where); };
    if (type === 'user') { await one('student', 'student', { userId: value.id }, include.student); await one('company', 'company', { userId: value.id }, include.company); }
    if (type === 'student') { await one('user', 'user', { id: value.userId }, include.user); await list('resumes', 'resume', { studentId: value.id }); await list('applications', 'application', { studentId: value.id }); await list('consents', 'consent', { studentId: value.id }); }
    if (type === 'company') { await one('user', 'user', { id: value.userId }, include.user); await list('jobDrives', 'jobDrive', { companyId: value.id }); }
    if (type === 'jobDrive') { await one('company', 'company', { id: value.companyId }, include.company); await list('branches', 'jobBranch', { jobId: value.id }); await list('skills', 'jobSkill', { jobId: value.id }); await list('applications', 'application', { jobId: value.id }); }
    if (type === 'application') { await one('student', 'student', { id: value.studentId }, include.student); await one('job', 'jobDrive', { id: value.jobId }, include.job); }
    return value;
  }
  resource(type) {
    const model = this.models[type];
    return {
      findUnique: async ({ where, include, includePasswordHash } = {}) => this.addRelations(type, await this.one(type, where, includePasswordHash), include),
      findFirst: async ({ where = {}, include } = {}) => {
        const query = model.findOne(this.normaliseWhere(where)).sort({ createdAt: -1 });
        if (type !== 'user') query.select('-passwordHash');
        return this.addRelations(type, plain(await query), include);
      },
      findMany: async ({ where = {}, include, take } = {}) => {
        let query = model.find(this.normaliseWhere(where)).sort({ createdAt: -1 });
        if (type !== 'user') query.select('-passwordHash');
        if (take) query = query.limit(take);
        const records = (await query).map(plain);
        return Promise.all(records.map(record => this.addRelations(type, record, include)));
      },
      create: async ({ data }) => {
        const { branches, skills, ...documentData } = data;
        const record = { ...documentData, createdAt: data.createdAt || now(), updatedAt: data.updatedAt || now() };
        const created = plain(await model.create(record));
        if (type === 'jobDrive') {
          await Promise.all((branches?.create || []).map(branch => this.models.jobBranch.create({ ...branch, jobId: created.id })));
          await Promise.all((skills?.create || []).map(skill => this.models.jobSkill.create({ ...skill, jobId: created.id })));
        }
        return this.addRelations(type, created, { branches: true, skills: true });
      },
      update: async ({ where, data }) => {
        const updated = plain(await model.findOneAndUpdate(this.normaliseWhere(where), { $set: { ...data, updatedAt: now() } }, { new: true }));
        if (!updated) throw new Error(`${type} not found`);
        return this.addRelations(type, updated, { branches: true, skills: true });
      },
      delete: async ({ where }) => plain(await model.findOneAndDelete(this.normaliseWhere(where))),
      count: async ({ where = {} } = {}) => model.countDocuments(this.normaliseWhere(where)),
    };
  }
  get user() { return this.resource('user'); } get student() { return this.resource('student'); }
  get company() { return this.resource('company'); } get jobDrive() { return this.resource('jobDrive'); }
  get application() { return this.resource('application'); } get consent() { return this.resource('consent'); }
  get auditLog() { return this.resource('auditLog'); } get notification() { return this.resource('notification'); }
  get resume() { return this.resource('resume'); } get resumeMatch() { return this.resource('resumeMatch'); }
  async $transaction(fn) { return typeof fn === 'function' ? fn(this) : Promise.all(fn); }
}

// In non-test environments, connect to MongoDB. Tests remain isolated in memory.
if (env.NODE_ENV !== 'test') {
  mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      activeDb = new MongoStore(mongoModels);
      logger.info('Connected to MongoDB database.');
    })
    .catch(() => {
      logger.warn('MongoDB is not currently reachable; using in-memory store.');
    activeDb = memoryDb;
    });
}

export const db = new Proxy({}, {
  get: (target, prop) => {
    return activeDb[prop];
  },
});

export default db;
