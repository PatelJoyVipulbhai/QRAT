import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing records
  await prisma.auditLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classroomImage.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("Password@123", 10);

  // 1. Create Admin
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@attendance.edu",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      admin: {
        create: {
          fullName: "System Administrator",
          phone: "+1 555-0199",
        },
      },
    },
  });

  // 2. Create Classes & Batches
  const classBBA1 = await prisma.class.create({
    data: {
      name: "BBA Semester 1",
      code: "BBA-S1",
      department: "Management",
      semester: "Semester 1",
      batches: {
        create: [{ name: "Division A" }, { name: "Division B" }],
      },
    },
    include: { batches: true },
  });

  const classBBA2 = await prisma.class.create({
    data: {
      name: "BBA Semester 2",
      code: "BBA-S2",
      department: "Management",
      semester: "Semester 2",
      batches: {
        create: [{ name: "Division A" }],
      },
    },
    include: { batches: true },
  });

  const classBCA1 = await prisma.class.create({
    data: {
      name: "BCA Semester 1",
      code: "BCA-S1",
      department: "Computer Applications",
      semester: "Semester 1",
      batches: {
        create: [{ name: "Division A" }, { name: "Division B" }],
      },
    },
    include: { batches: true },
  });

  // 3. Create Subjects
  const subEconomics = await prisma.subject.create({
    data: { name: "Economics & Market Analysis", code: "ECO-101", department: "Management" },
  });
  const subAccounts = await prisma.subject.create({
    data: { name: "Financial Accounting", code: "ACC-102", department: "Management" },
  });
  const subMarketing = await prisma.subject.create({
    data: { name: "Principles of Marketing", code: "MKT-103", department: "Management" },
  });
  const subCS = await prisma.subject.create({
    data: { name: "Computer Fundamentals & C", code: "BCA-101", department: "Computer Applications" },
  });
  const subMath = await prisma.subject.create({
    data: { name: "Discrete Mathematics", code: "MTH-102", department: "Computer Applications" },
  });

  // 4. Create Teachers
  const teacher1User = await prisma.user.create({
    data: {
      email: "prof.shah@attendance.edu",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      teacher: {
        create: {
          teacherId: "FAC-1001",
          fullName: "Prof. Rajesh Shah",
          email: "prof.shah@attendance.edu",
          phone: "+1 555-0111",
          department: "Management",
          status: "Active",
        },
      },
    },
    include: { teacher: true },
  });

  const teacher2User = await prisma.user.create({
    data: {
      email: "prof.patel@attendance.edu",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      teacher: {
        create: {
          teacherId: "FAC-1002",
          fullName: "Dr. Ananya Patel",
          email: "prof.patel@attendance.edu",
          phone: "+1 555-0112",
          department: "Management",
          status: "Active",
        },
      },
    },
    include: { teacher: true },
  });

  const teacher3User = await prisma.user.create({
    data: {
      email: "prof.mehta@attendance.edu",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      teacher: {
        create: {
          teacherId: "FAC-1003",
          fullName: "Prof. Vikram Mehta",
          email: "prof.mehta@attendance.edu",
          phone: "+1 555-0113",
          department: "Computer Applications",
          status: "Active",
        },
      },
    },
    include: { teacher: true },
  });

  // Assign Subjects to Teachers
  if (teacher1User.teacher) {
    await prisma.teacherSubject.create({
      data: { teacherId: teacher1User.teacher.id, subjectId: subEconomics.id },
    });
  }
  if (teacher2User.teacher) {
    await prisma.teacherSubject.create({
      data: { teacherId: teacher2User.teacher.id, subjectId: subAccounts.id },
    });
    await prisma.teacherSubject.create({
      data: { teacherId: teacher2User.teacher.id, subjectId: subMarketing.id },
    });
  }
  if (teacher3User.teacher) {
    await prisma.teacherSubject.create({
      data: { teacherId: teacher3User.teacher.id, subjectId: subCS.id },
    });
    await prisma.teacherSubject.create({
      data: { teacherId: teacher3User.teacher.id, subjectId: subMath.id },
    });
  }

  // 5. Create 20 Sample Students
  const studentNames = [
    "Rahul Patel", "Jay Shah", "Dev Patel", "Amit Shah", "Pooja Sharma",
    "Rohan Verma", "Sneha Joshi", "Aditya Nair", "Kavita Rao", "Manish Gupta",
    "Priya Deshmukh", "Karan Malhotra", "Riya Sen", "Deepak Chopra", "Neha Bansal",
    "Siddharth Roy", "Anjali Mehta", "Varun Dhawan", "Divya Pillai", "Harsh Vardhan"
  ];

  const studentsList = [];
  for (let i = 0; i < studentNames.length; i++) {
    const name = studentNames[i];
    const rollNo = (101 + i).toString();
    const email = `student${rollNo}@attendance.edu`;
    const assignedClass = i < 12 ? classBBA1 : classBCA1;
    const assignedBatch = assignedClass.batches[i % assignedClass.batches.length];

    const studentUser = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        role: "STUDENT",
        student: {
          create: {
            studentId: `STU-2026-${rollNo}`,
            rollNumber: rollNo,
            fullName: name,
            email,
            phone: `+1 555-02${i < 10 ? "0" + i : i}`,
            department: assignedClass.department,
            semester: assignedClass.semester,
            faceConsentGiven: true,
            status: "Active",
          },
        },
      },
      include: { student: true },
    });

    if (studentUser.student) {
      studentsList.push(studentUser.student);
      await prisma.enrollment.create({
        data: {
          studentId: studentUser.student.id,
          classId: assignedClass.id,
          batchId: assignedBatch?.id,
        },
      });
    }
  }

  // 6. Create Sample Active Lecture & QR Code
  if (teacher1User.teacher) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const activeLecture = await prisma.lecture.create({
      data: {
        teacherId: teacher1User.teacher.id,
        classId: classBBA1.id,
        batchId: classBBA1.batches[0].id,
        subjectId: subEconomics.id,
        title: "Demand & Supply Elasticity",
        date: now.toISOString().split("T")[0],
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        attendanceDurationMinutes: 10,
        expiresAt,
        status: "ACTIVE",
        currentCode: "482731",
        qrSecret: "sec-token-eco-482731",
      },
    });

    // Seed initial attendance for 5 students
    for (let j = 0; j < 5; j++) {
      const student = studentsList[j];
      if (student) {
        await prisma.attendance.create({
          data: {
            lectureId: activeLecture.id,
            studentId: student.id,
            status: "PRESENT",
            method: j % 2 === 0 ? "QR" : "SIX_DIGIT_CODE",
            markedAt: new Date(now.getTime() - (5 - j) * 60 * 1000),
          },
        });
      }
    }
  }

  console.log("Database successfully seeded with Admin, Teachers, Students, Classes, Subjects, and Sample Active Lecture!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
