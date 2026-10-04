import bcrypt from 'bcryptjs';
import { connectToDatabase, db } from '../src/config/database.js';

export async function seed() {
  console.log('Seeding DCRUST Campus Placement & Eligibility Portal database...');

  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@dcrust.edu.in' } });
  if (existingAdmin) {
    console.log('Seed data already present. Skipping duplicate insert.');
    return;
  }

  // 1. Password Hashes
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const recruiterPassword = await bcrypt.hash('Recruiter@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  // 2. Admin User
  const admin = await db.user.create({
    data: {
      name: 'Prof. S. K. Garg',
      email: 'admin@dcrust.edu.in',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 3. Company Recruiter User
  const recruiterUser = await db.user.create({
    data: {
      name: 'Rajesh Mittal',
      email: 'recruiter@tcs.com',
      passwordHash: recruiterPassword,
      role: 'COMPANY',
      isActive: true,
    },
  });

  // 4. Company Profile
  const company = await db.company.create({
    data: {
      userId: recruiterUser.id,
      companyName: 'ABC Technologies',
      companyEmail: 'recruiter@tcs.com',
      industry: 'Information Technology & Software Services',
      website: 'https://abctech.example.com',
      description: 'Leading global enterprise technology and IT consulting organization.',
      verified: true,
    },
  });

  // 5. Job Drive
  const job = await db.jobDrive.create({
    data: {
      companyId: company.id,
      title: 'Associate Software Engineer - Campus Drive 2026',
      description: 'Full stack development role working on enterprise cloud systems with React, Node.js, Express, and PostgreSQL.',
      jobType: 'Full-time',
      location: 'Gurugram / Noida (Hybrid)',
      salaryMin: 700000,
      salaryMax: 1000000,
      minCgpa: 7.0,
      maxBacklogs: 0,
      eligibleBatches: [2025],
      applicationStart: new Date('2026-01-01'),
      applicationEnd: new Date('2026-12-31'),
      status: 'ACTIVE',
      branches: {
        create: [
          { branch: 'CSE' },
          { branch: 'ECE' },
          { branch: 'IT' },
        ],
      },
      skills: {
        create: [
          { skill: 'React' },
          { skill: 'Node.js' },
          { skill: 'Express' },
          { skill: 'PostgreSQL' },
          { skill: 'Docker' },
          { skill: 'Git' },
        ],
      },
    },
  });

  // 6. Student 1: Eligible (CGPA 8.2, CSE, 0 backlogs)
  const studentUser1 = await db.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'student@dcrust.ac.in',
      passwordHash: studentPassword,
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student1 = await db.student.create({
    data: {
      userId: studentUser1.id,
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
    },
  });

  // Student 1 Consent
  await db.consent.create({
    data: {
      studentId: student1.id,
      consentType: 'PLACEMENT_POLICY',
      version: 'V2',
      accepted: true,
    },
  });

  // 7. Student 2: Ineligible for Job 1 due to CGPA (6.4 < 7.0) and Backlog (1 > 0)
  const studentUser2 = await db.user.create({
    data: {
      name: 'Priya Verma',
      email: 'priya@dcrust.ac.in',
      passwordHash: studentPassword,
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student2 = await db.student.create({
    data: {
      userId: studentUser2.id,
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
    },
  });

  await db.consent.create({
    data: {
      studentId: student2.id,
      consentType: 'PLACEMENT_POLICY',
      version: 'V2',
      accepted: true,
    },
  });

  // 8. Student 3: Profile Incomplete & Missing Consent
  const studentUser3 = await db.user.create({
    data: {
      name: 'Aman Malik',
      email: 'aman@dcrust.ac.in',
      passwordHash: studentPassword,
      role: 'STUDENT',
      isActive: true,
    },
  });

  await db.student.create({
    data: {
      userId: studentUser3.id,
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
    },
  });

  console.log('Database seeded successfully with Admin, Company, Students, and Drives.');
}

// Auto-run if invoked directly
if (process.argv[1]?.endsWith('seed.js')) {
  connectToDatabase()
    .then(() => seed())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

export default seed;
