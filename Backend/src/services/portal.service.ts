import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";
import type {
  AcademicYear,
  AttendanceRecord,
  Batch,
  Faculty,
  MentorAssignment,
  PromotionDraft,
  ResultRecord,
  Role,
  Semester,
  Student,
  StudentEnrollment,
  Subject,
  YearLevel,
} from "../types/domain.js";
import { ApiError, buildPagination } from "../utils/http.js";

type Scope = {
  universityId: string;
  hodBatchIds: string[];
  hodSemesterIds: string[];
  userId: string;
};

type ListQuery = { page?: number; limit?: number; search?: string };

function getUniversity(universityId: string) {
  const university = store.universities.find((item) => item.id === universityId);
  if (!university) {
    throw new ApiError(404, "UNIVERSITY_NOT_FOUND", "University not found.");
  }
  return university;
}

function getActiveSemester(universityId: string) {
  const semester = store.semesters.find((item) => item.universityId === universityId && item.isActive);
  if (!semester) {
    throw new ApiError(404, "ACTIVE_SEMESTER_NOT_FOUND", "No active semester configured.");
  }
  return semester;
}

function getSemester(semesterId?: string, universityId?: string) {
  const semester = semesterId
    ? store.semesters.find((item) => item.id === semesterId)
    : universityId
      ? getActiveSemester(universityId)
      : undefined;
  if (!semester) {
    throw new ApiError(404, "SEMESTER_NOT_FOUND", "Semester not found.");
  }
  return semester;
}

function getAcademicYear(academicYearId: string) {
  const year = store.academicYears.find((item) => item.id === academicYearId);
  if (!year) {
    throw new ApiError(404, "ACADEMIC_YEAR_NOT_FOUND", "Academic year not found.");
  }
  return year;
}

function paginate<T>(rows: T[], page = 1, limit = 20) {
  const total = rows.length;
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    ...buildPagination(page, limit, total),
  };
}

function statusFromAttendanceAndMarks(attendancePct: number, avgMarksPct: number, isActive = true) {
  if (!isActive) {
    return "INACTIVE";
  }
  if (attendancePct < store.attendanceRules.minThresholdPct || avgMarksPct < 40) {
    return "AT_RISK";
  }
  return "ACTIVE";
}

function currentEnrollmentForStudent(studentId: string, semesterId?: string) {
  return store.studentEnrollments.find(
    (item) => item.studentId === studentId && item.isCurrent && (!semesterId || item.semesterId === semesterId),
  );
}

function batchById(batchId: string) {
  const batch = store.batches.find((item) => item.id === batchId);
  if (!batch) {
    throw new ApiError(404, "BATCH_NOT_FOUND", "Batch not found.");
  }
  return batch;
}

function studentByEnrollmentNo(enrollmentNo: string) {
  const student = store.students.find((item) => item.enrollmentNo === enrollmentNo && !item.deletedAt);
  if (!student) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found.");
  }
  return student;
}

function facultyByEmployeeId(employeeId: string) {
  const faculty = store.faculties.find((item) => item.employeeId === employeeId && !item.deletedAt);
  if (!faculty) {
    throw new ApiError(404, "FACULTY_NOT_FOUND", "Faculty not found.");
  }
  return faculty;
}

function facultyById(facultyId: string) {
  const faculty = store.faculties.find((item) => item.id === facultyId && !item.deletedAt);
  if (!faculty) {
    throw new ApiError(404, "FACULTY_NOT_FOUND", "Faculty not found.");
  }
  return faculty;
}

function subjectById(subjectId: string) {
  const subject = store.subjects.find((item) => item.id === subjectId);
  if (!subject) {
    throw new ApiError(404, "SUBJECT_NOT_FOUND", "Subject not found.");
  }
  return subject;
}

function phaseById(phaseId: string) {
  const phase = store.phases.find((item) => item.id === phaseId);
  if (!phase) {
    throw new ApiError(404, "PHASE_NOT_FOUND", "Phase not found.");
  }
  return phase;
}

function enrollmentById(enrollmentId: string) {
  const enrollment = store.studentEnrollments.find((item) => item.id === enrollmentId);
  if (!enrollment) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found.");
  }
  return enrollment;
}

function ensureBatchInScope(batchId: string, scope: Scope) {
  if (!scope.hodBatchIds.includes(batchId)) {
    throw new ApiError(403, "BATCH_NOT_IN_SCOPE", "Requested batch is not in this HOD's scope.");
  }
}

function scopedCurrentEnrollments(scope: Scope, semesterId?: string) {
  return store.studentEnrollments.filter(
    (item) =>
      item.isCurrent &&
      scope.hodBatchIds.includes(item.batchId) &&
      (!semesterId || item.semesterId === semesterId),
  );
}

function allAttendanceForEnrollment(enrollmentId: string, semesterId?: string) {
  return store.attendanceRecords.filter(
    (item) => item.enrollmentId === enrollmentId && (!semesterId || item.semesterId === semesterId),
  );
}

function percentage(record: AttendanceRecord) {
  return record.totalLectures === 0 ? 0 : Number(((record.attendedLectures / record.totalLectures) * 100).toFixed(2));
}

function currentPhaseForSemester(semesterId: string) {
  return store.phases.find((item) => item.semesterId === semesterId && item.isActive) ??
    store.phases.find((item) => item.semesterId === semesterId);
}

function latestResults(scope: Scope, batchId?: string, phaseId?: string) {
  return store.results.filter((item) => {
    const enrollment = enrollmentById(item.enrollmentId);
    return (
      scope.hodBatchIds.includes(item.batchId) &&
      (!batchId || item.batchId === batchId) &&
      (!phaseId || item.phaseId === phaseId) &&
      enrollment.isCurrent
    );
  });
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return Number((values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(1));
}

function getMentorAssignment(studentId: string, semesterId: string) {
  return store.mentorAssignments.find((item) => item.studentId === studentId && item.semesterId === semesterId);
}

function getScopedFaculty(scope: Scope) {
  const facultyIds = new Set(
    store.facultyBatchAssignments
      .filter((item) => scope.hodBatchIds.includes(item.batchId))
      .map((item) => item.facultyId),
  );
  facultyIds.add(scope.userId);
  return store.faculties.filter((item) => facultyIds.has(item.id) && !item.deletedAt);
}

export const portalService = {
  login(email: string, password: string, role?: Role | "HOD") {
    if (role === "STUDENT") {
      const student = store.students.find(
        (item) => (item.email === email || item.enrollmentNo === email) && item.password === password,
      );
      if (!student) {
        throw new ApiError(401, "INVALID_CREDENTIALS", "Wrong email or password.");
      }
      if (!student.isActive) {
        throw new ApiError(403, "ACCOUNT_INACTIVE", "Account is inactive.");
      }
      const refreshToken = `refresh:${student.id}:${Date.now()}`;
      store.refreshTokens.push({
        token: refreshToken,
        userId: student.id,
        role: "STUDENT",
        accessRole: "STUDENT",
        expiresAt: "2026-12-31T23:59:59.000Z",
      });
      return {
        accessToken: `STUDENT:${student.id}`,
        refreshToken,
        expiresIn: 900,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: "STUDENT",
          isHod: false,
          universityId: student.universityId,
          department: student.branch,
          mentorCode: null,
        },
      };
    }

    const faculty = store.faculties.find((item) => item.email === email && item.password === password);
    if (!faculty) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Wrong email or password.");
    }
    if (!faculty.isActive) {
      throw new ApiError(403, "ACCOUNT_INACTIVE", "Account is inactive.");
    }

    const resolvedRole: "HOD" | "FACULTY" | "SUPER_ADMIN" =
      role === "SUPER_ADMIN" ? "SUPER_ADMIN" : faculty.isHod ? "HOD" : "FACULTY";
    const refreshToken = `refresh:${faculty.id}:${Date.now()}`;
    store.refreshTokens.push({
      token: refreshToken,
      userId: faculty.id,
      role: resolvedRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "FACULTY",
      accessRole: resolvedRole,
      expiresAt: "2026-12-31T23:59:59.000Z",
    });
    return {
      accessToken: `${resolvedRole}:${faculty.id}`,
      refreshToken,
      expiresIn: 900,
      user: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        role: "FACULTY",
        isHod: faculty.isHod,
        universityId: faculty.universityId,
        department: faculty.department,
        mentorCode: faculty.mentorCode,
      },
    };
  },

  register(
    body: {
      role: "HOD" | "FACULTY" | "STUDENT";
      name: string;
      email: string;
      password: string;
      universityId?: string;
      employeeId?: string;
      enrollmentNo?: string;
      department?: string;
      phone?: string;
      branch?: string;
      admissionYear?: number;
      isHod?: boolean;
    },
    universityId: string,
  ) {
    if (body.password.length < 8) {
      throw new ApiError(400, "PASSWORD_TOO_WEAK", "Password must be at least 8 characters.");
    }

    if (body.role === "STUDENT") {
      if (!body.enrollmentNo || !body.branch || !body.admissionYear) {
        throw new ApiError(
          400,
          "VALIDATION_ERROR",
          "Student registration requires enrollmentNo, branch, and admissionYear.",
        );
      }

      if (
        store.students.some(
          (item) => item.email === body.email || item.enrollmentNo === body.enrollmentNo,
        )
      ) {
        throw new ApiError(409, "CONFLICT", "Student email or enrollment number already exists.");
      }

      const student: Student = {
        id: `stu_${Date.now()}`,
        universityId,
        enrollmentNo: body.enrollmentNo,
        name: body.name,
        email: body.email,
        phone: body.phone ?? "",
        branch: body.branch,
        admissionYear: body.admissionYear,
        isActive: true,
        password: body.password,
      };
      store.students.push(student);

      return {
        id: student.id,
        role: "STUDENT",
        enrollmentNo: student.enrollmentNo,
        name: student.name,
        email: student.email,
      };
    }

    if (!body.employeeId || !body.department) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Faculty/HOD registration requires employeeId and department.",
      );
    }

    if (
      store.faculties.some(
        (item) => item.email === body.email || item.employeeId === body.employeeId,
      )
    ) {
      throw new ApiError(409, "CONFLICT", "Faculty email or employeeId already exists.");
    }

    const isHod = body.role === "HOD" || body.isHod === true;
    const faculty: Faculty = {
      id: `fac_${Date.now()}`,
      universityId,
      name: body.name,
      email: body.email,
      department: body.department,
      employeeId: body.employeeId,
      isHod,
      isActive: true,
      phone: body.phone ?? "",
      mentorCode: isHod ? null : null,
      profilePhotoUrl: null,
      password: body.password,
    };
    store.faculties.push(faculty);

    return {
      id: faculty.id,
      role: isHod ? "HOD" : "FACULTY",
      employeeId: faculty.employeeId,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
    };
  },

  refresh(refreshToken: string) {
    const token = store.refreshTokens.find((item) => item.token === refreshToken);
    if (!token) {
      throw new ApiError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid.");
    }
    return {
      accessToken: `${token.accessRole}:${token.userId}`,
      expiresIn: 900,
    };
  },

  logout(refreshToken: string) {
    store.refreshTokens = store.refreshTokens.filter((item) => item.token !== refreshToken);
  },

  me(userId: string, role: Role, universityId: string) {
    if (role === "STUDENT") {
      const student = store.students.find((item) => item.id === userId);
      if (!student) {
        throw new ApiError(404, "NOT_FOUND", "User not found.");
      }
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        role: "STUDENT",
        isHod: false,
        department: student.branch,
        employeeId: null,
        profilePhotoUrl: null,
        university: getUniversity(universityId),
      };
    }
    if (role === "SUPER_ADMIN") {
      const admin = facultyById(userId);
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "SUPER_ADMIN",
        isHod: false,
        department: admin.department,
        employeeId: admin.employeeId,
        profilePhotoUrl: admin.profilePhotoUrl,
        university: getUniversity(universityId),
      };
    }
    const faculty = facultyById(userId);
    return {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      role: "FACULTY",
      isHod: faculty.isHod,
      department: faculty.department,
      employeeId: faculty.employeeId,
      profilePhotoUrl: faculty.profilePhotoUrl,
      university: getUniversity(universityId),
    };
  },

  myScope(scope: Scope) {
    const faculty = facultyById(scope.userId);
    const activeSemester = getActiveSemester(scope.universityId);
    const batches = scope.hodBatchIds.map((batchId) => {
      const batch = batchById(batchId);
      const studentCount = scopedCurrentEnrollments(scope, activeSemester.id).filter(
        (item) => item.batchId === batchId,
      ).length;
      return {
        id: batch.id,
        code: batch.code,
        yearLevel: batch.yearLevel,
        studentCount,
      };
    });
    const totalFaculty = new Set(
      store.facultyBatchAssignments
        .filter((item) => scope.hodBatchIds.includes(item.batchId))
        .map((item) => item.facultyId),
    ).size;
    return {
      hod: {
        id: faculty.id,
        name: faculty.name,
        department: faculty.department,
        employeeId: faculty.employeeId,
      },
      activeSemester: {
        id: activeSemester.id,
        label: activeSemester.label,
        number: activeSemester.number,
      },
      batches,
      totalStudents: batches.reduce((sum, item) => sum + item.studentCount, 0),
      totalFaculty,
    };
  },

  dashboardSummary(scope: Scope) {
    const enrollments = scopedCurrentEnrollments(scope);
    const avgAttendance = average(enrollments.map((item) => item.attendancePct));
    const resultRows = latestResults(scope);
    const published = resultRows.filter((item) => item.isPublished).length;
    return {
      totalStudents: {
        value: enrollments.length,
        deltaLabel: `+${Math.max(1, Math.floor(enrollments.length / 4))} this semester`,
        trend: "up",
      },
      totalFaculty: {
        value: getScopedFaculty(scope).length,
        deltaLabel: "No change",
        trend: "neutral",
      },
      activeBatches: {
        value: scope.hodBatchIds.length,
        deltaLabel: `+${Math.max(1, scope.hodBatchIds.length - 1)} this semester`,
        trend: "up",
      },
      avgAttendance: {
        value: avgAttendance,
        deltaLabel: "+2.1% this month",
        trend: "up",
      },
      resultsUploadedPct: {
        value: resultRows.length === 0 ? 0 : Math.round((published / resultRows.length) * 100),
        deltaLabel: "T2 Completed",
        trend: "neutral",
      },
    };
  },

  dashboardAttendanceTrend(_scope: Scope, months = 6) {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    return {
      labels: labels.slice(Math.max(0, labels.length - months)),
      data: [78, 81, 85, 88, 86, 91, 89, 92].slice(Math.max(0, 8 - months)),
    };
  },

  dashboardResultsOverview(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const phases = store.phases
      .filter((item) => item.semesterId === semester.id)
      .map((phase) => {
        const rows = latestResults(scope, undefined, phase.id);
        return {
          phase: phase.label,
          avgMarksPct: rows.length === 0 ? null : average(rows.map((item) => (item.marksObtained / item.maxMarks) * 100)),
          status: phase.isComplete ? "complete" : phase.isActive ? "complete" : "pending",
        };
      });
    return { phases };
  },

  dashboardAtRisk(scope: Scope, limit = 5) {
    const rows = scopedCurrentEnrollments(scope)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const batch = batchById(item.batchId);
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          batchCode: batch.code,
          attendancePct: item.attendancePct,
          avgMarksPct: item.avgMarksPct,
          status: "Needs Attention",
        };
      })
      .filter((item) => item.attendancePct < 75 || item.avgMarksPct < 40)
      .slice(0, limit);
    return { data: rows, total: rows.length };
  },

  dashboardActivityFeed(scope: Scope, page = 1, limit = 10) {
    const rows = store.activities
      .filter((item) => scope.hodBatchIds.includes(item.batchId))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((item) => ({
        ...item,
        icon: item.type === "RESULT_UPLOAD" ? "📋" : "🧑‍🏫",
      }));
    return paginate(rows, page, limit);
  },

  listStudents(scope: Scope, query: Record<string, string | number | undefined>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const semester = getSemester(query.semesterId as string | undefined, scope.universityId);
    const batchId = query.batchId as string | undefined;
    if (batchId) {
      ensureBatchInScope(batchId, scope);
    }
    const rows = scopedCurrentEnrollments(scope, semester.id)
      .filter((item) => !batchId || item.batchId === batchId)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const batch = batchById(item.batchId);
        return {
          id: student.id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          branch: student.branch,
          currentBatch: { id: batch.id, code: batch.code },
          currentSemester: { id: semester.id, label: semester.label },
          currentRollNo: item.rollNo,
          attendancePct: item.attendancePct,
          status: statusFromAttendanceAndMarks(item.attendancePct, item.avgMarksPct, student.isActive),
        };
      })
      .filter((item) => !query.search || item.name.toLowerCase().includes(String(query.search).toLowerCase()) || item.enrollmentNo.includes(String(query.search)))
      .filter((item) => !query.yearLevel || batchById(item.currentBatch.id).yearLevel === query.yearLevel)
      .filter((item) => !query.branch || item.branch === query.branch)
      .filter((item) => !query.status || item.status === query.status);
    return paginate(rows, page, limit);
  },

  getStudent(scope: Scope, enrollmentNo: string) {
    const student = studentByEnrollmentNo(enrollmentNo);
    const enrollment = currentEnrollmentForStudent(student.id);
    if (!enrollment || !scope.hodBatchIds.includes(enrollment.batchId)) {
      throw new ApiError(404, "NOT_FOUND", "Student not found.");
    }
    const semester = getSemester(enrollment.semesterId);
    const batch = batchById(enrollment.batchId);
    return {
      enrollmentNo: student.enrollmentNo,
      name: student.name,
      email: student.email,
      phone: student.phone,
      branch: student.branch,
      admissionYear: student.admissionYear,
      status: statusFromAttendanceAndMarks(enrollment.attendancePct, enrollment.avgMarksPct, student.isActive),
      currentEnrollment: {
        batchCode: batch.code,
        semesterLabel: semester.label,
        yearLevel: batch.yearLevel,
        rollNo: enrollment.rollNo,
        attendancePct: enrollment.attendancePct,
      },
    };
  },

  getStudentHistory(scope: Scope, enrollmentNo: string) {
    const student = studentByEnrollmentNo(enrollmentNo);
    const currentEnrollment = currentEnrollmentForStudent(student.id);
    if (!currentEnrollment || !scope.hodBatchIds.includes(currentEnrollment.batchId)) {
      throw new ApiError(404, "NOT_FOUND", "Student not found.");
    }
    const journey = store.studentEnrollments
      .filter((item) => item.studentId === student.id)
      .sort((left, right) => left.semesterId.localeCompare(right.semesterId))
      .map((item) => {
        const semester = getSemester(item.semesterId);
        const batch = batchById(item.batchId);
        const year = getAcademicYear(semester.academicYearId);
        return {
          semesterNumber: semester.number,
          yearLevel: batch.yearLevel,
          batchCode: batch.code,
          rollNo: item.rollNo,
          academicYear: year.label,
          promotedFromEnrollmentId: item.promotedFromEnrollmentId ?? undefined,
        };
      });
    return { enrollmentNo, journey };
  },

  createStudent(body: Record<string, string | number>) {
    if (store.students.some((item) => item.enrollmentNo === body.enrollmentNo)) {
      throw new ApiError(409, "ENROLLMENT_NO_ALREADY_EXISTS", "Enrollment number already exists.");
    }
    const id = `stu_${Date.now()}`;
    store.students.push({
      id,
      universityId: "univ_lju_01",
      enrollmentNo: String(body.enrollmentNo),
      name: String(body.name),
      email: String(body.email),
      phone: String(body.phone ?? ""),
      branch: String(body.branch),
      admissionYear: Number(body.admissionYear),
      isActive: true,
      password: "StudentPass123",
    });
    return {
      id,
      enrollmentNo: String(body.enrollmentNo),
      name: String(body.name),
      temporaryPassword: `${String(body.enrollmentNo).slice(-4)}@123`,
    };
  },

  updateStudent(scope: Scope, enrollmentNo: string, body: Record<string, string>) {
    this.getStudent(scope, enrollmentNo);
    const student = studentByEnrollmentNo(enrollmentNo);
    student.name = body.name ?? student.name;
    student.email = body.email ?? student.email;
    student.phone = body.phone ?? student.phone;
    student.branch = body.branch ?? student.branch;
    return this.getStudent(scope, enrollmentNo);
  },

  updateStudentStatus(enrollmentNo: string, isActive: boolean) {
    const student = studentByEnrollmentNo(enrollmentNo);
    student.isActive = isActive;
    return { enrollmentNo, isActive };
  },

  deleteStudent(enrollmentNo: string) {
    const student = studentByEnrollmentNo(enrollmentNo);
    const activeEnrollment = currentEnrollmentForStudent(student.id);
    if (activeEnrollment && student.isActive) {
      throw new ApiError(409, "STUDENT_HAS_ACTIVE_ENROLLMENT", "Deactivate the student first.");
    }
    student.deletedAt = new Date().toISOString();
  },

  studentCsvUpload() {
    return { inserted: 2, updated: 1, errors: [] };
  },

  studentCsvTemplate() {
    return "enrollment_no,name,email,branch,phone\n24002170210127,Kavy Thakar,kavy@lj.edu,IT,9876543210\n";
  },

  studentExport(scope: Scope) {
    const rows = this.listStudents(scope, { page: 1, limit: 1000 }).data;
    const lines = ["enrollment_no,name,branch,batch,roll_no,attendance_pct,status"];
    rows.forEach((item) => {
      lines.push(
        [
          item.enrollmentNo,
          item.name,
          item.branch,
          item.currentBatch.code,
          item.currentRollNo,
          item.attendancePct,
          item.status,
        ].join(","),
      );
    });
    return lines.join("\n");
  },

  listFaculty(scope: Scope, query: Record<string, string | number | undefined>) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const rows = getScopedFaculty(scope)
      .map((item) => {
        const subjectCount = new Set(
          store.facultyBatchAssignments.filter((entry) => entry.facultyId === item.id && entry.subjectId).map((entry) => entry.subjectId),
        ).size;
        const menteeCount = store.mentorAssignments.filter((entry) => entry.facultyId === item.id).length;
        return {
          id: item.id,
          employeeId: item.employeeId,
          name: item.name,
          department: item.department,
          isHod: item.isHod,
          mentorCode: item.mentorCode,
          subjectCount,
          menteeCount,
          status: item.isActive ? "ACTIVE" : "INACTIVE",
        };
      })
      .filter((item) => !query.search || item.name.toLowerCase().includes(String(query.search).toLowerCase()) || item.employeeId.includes(String(query.search)))
      .filter((item) => !query.department || item.department === query.department)
      .filter((item) => !query.role || (query.role === "HOD" ? item.isHod : !item.isHod))
      .filter((item) => !query.status || item.status === query.status);
    return paginate(rows, page, limit);
  },

  getFaculty(scope: Scope, employeeId: string) {
    const faculty = facultyByEmployeeId(employeeId);
    const visibleFacultyIds = new Set(getScopedFaculty(scope).map((item) => item.id));
    if (!visibleFacultyIds.has(faculty.id)) {
      throw new ApiError(404, "NOT_FOUND", "Faculty not found.");
    }
    const subjectAssignments = store.facultyBatchAssignments.filter((item) => item.facultyId === faculty.id && item.subjectId);
    const subjects = Array.from(new Set(subjectAssignments.map((item) => item.subjectId!))).map((subjectId) => {
      const subject = subjectById(subjectId);
      return {
        code: subject.code,
        name: subject.name,
        batches: subjectAssignments
          .filter((item) => item.subjectId === subjectId)
          .map((item) => batchById(item.batchId).code),
      };
    });
    return {
      employeeId: faculty.employeeId,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      isHod: faculty.isHod,
      mentorCode: faculty.mentorCode,
      menteeCount: store.mentorAssignments.filter((item) => item.facultyId === faculty.id).length,
      subjects,
      status: faculty.isActive ? "ACTIVE" : "INACTIVE",
    };
  },

  createFaculty(body: Record<string, string | boolean>) {
    const id = `fac_${Date.now()}`;
    store.faculties.push({
      id,
      universityId: "univ_lju_01",
      employeeId: String(body.employeeId),
      name: String(body.name),
      email: String(body.email),
      phone: String(body.phone ?? ""),
      department: String(body.department),
      isHod: Boolean(body.isHod),
      isActive: true,
      mentorCode: body.isHod ? null : null,
      profilePhotoUrl: null,
      password: "SecurePass123",
    });
    return { id, employeeId: String(body.employeeId), temporaryPassword: `${String(body.employeeId)}@123` };
  },

  updateFaculty(employeeId: string, body: Record<string, string>) {
    const faculty = facultyByEmployeeId(employeeId);
    faculty.name = body.name ?? faculty.name;
    faculty.email = body.email ?? faculty.email;
    faculty.phone = body.phone ?? faculty.phone;
    faculty.department = body.department ?? faculty.department;
    return this.getFaculty({ universityId: faculty.universityId, hodBatchIds: store.hodBatchScopes.map((item) => item.batchId), hodSemesterIds: ["sem_3"], userId: "fac_001" }, employeeId);
  },

  updateMentorCode(employeeId: string, mentorCode: string) {
    const faculty = facultyByEmployeeId(employeeId);
    if (faculty.isHod) {
      throw new ApiError(400, "CANNOT_SET_MENTOR_CODE_FOR_HOD", "HOD cannot have a mentor code.");
    }
    if (store.faculties.some((item) => item.mentorCode === mentorCode && item.id !== faculty.id)) {
      throw new ApiError(409, "MENTOR_CODE_ALREADY_IN_USE", "Mentor code already in use.");
    }
    faculty.mentorCode = mentorCode;
    return { employeeId, mentorCode };
  },

  updateFacultyStatus(employeeId: string, isActive: boolean) {
    const faculty = facultyByEmployeeId(employeeId);
    faculty.isActive = isActive;
    return { employeeId, status: isActive ? "ACTIVE" : "INACTIVE" };
  },

  deleteFaculty(employeeId: string) {
    const faculty = facultyByEmployeeId(employeeId);
    const hasAssignments = store.facultyBatchAssignments.some((item) => item.facultyId === faculty.id);
    const hasMentees = store.mentorAssignments.some((item) => item.facultyId === faculty.id);
    if (hasAssignments || hasMentees) {
      throw new ApiError(409, "FACULTY_HAS_ACTIVE_ASSIGNMENTS", "Faculty has active assignments.");
    }
    faculty.deletedAt = new Date().toISOString();
  },

  facultyCsvUpload() {
    return { inserted: 1, updated: 0, errors: [] };
  },

  createFacultyAssignment(body: Record<string, string>) {
    if (
      store.facultyBatchAssignments.some(
        (item) =>
          item.facultyId === body.facultyId &&
          item.subjectId === body.subjectId &&
          item.batchId === body.batchId &&
          item.semesterId === body.semesterId,
      )
    ) {
      throw new ApiError(409, "ASSIGNMENT_ALREADY_EXISTS", "Assignment already exists.");
    }
    const id = `fba_${Date.now()}`;
    store.facultyBatchAssignments.push({
      id,
      facultyId: String(body.facultyId),
      subjectId: String(body.subjectId),
      batchId: String(body.batchId),
      semesterId: String(body.semesterId),
    });
    return {
      id,
      faculty: { id: String(body.facultyId), name: facultyById(String(body.facultyId)).name },
      subject: { code: subjectById(String(body.subjectId)).code },
      batch: { code: batchById(String(body.batchId)).code },
    };
  },

  deleteFacultyAssignment(assignmentId: string) {
    store.facultyBatchAssignments = store.facultyBatchAssignments.filter((item) => item.id !== assignmentId);
  },

  facultyExport(scope: Scope) {
    const rows = this.listFaculty(scope, { page: 1, limit: 1000 }).data;
    return ["employee_id,name,department,mentor_code,status", ...rows.map((row) => [row.employeeId, row.name, row.department, row.mentorCode ?? "", row.status].join(","))].join("\n");
  },

  resultsUploadContext(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const year = getAcademicYear(semester.academicYearId);
    return {
      academicYears: [{ id: year.id, label: year.label }],
      semesters: store.semesters
        .filter((item) => item.academicYearId === year.id)
        .map((item) => ({ id: item.id, label: item.label, number: item.number })),
      phases: store.phases.filter((item) => item.semesterId === semester.id),
      subjects: store.subjects.filter((item) => item.semesterId === semester.id).map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
      })),
      batches: store.batches.filter((item) => scope.hodBatchIds.includes(item.id)).map((item) => ({
        id: item.id,
        code: item.code,
      })),
    };
  },

  resultsStudents(scope: Scope, semesterId: string, batchId: string, subjectId: string) {
    ensureBatchInScope(batchId, scope);
    subjectById(subjectId);
    const data = scopedCurrentEnrollments(scope, semesterId)
      .filter((item) => item.batchId === batchId)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const existing = store.results.find((entry) => entry.enrollmentId === item.id && entry.subjectId === subjectId);
        return {
          enrollmentId: item.id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          existingMarks: existing?.marksObtained ?? null,
        };
      });
    return { data };
  },

  resultsUpload(body: Record<string, string>) {
    const phase = phaseById(String(body.phaseId));
    const subject = subjectById(String(body.subjectId));
    const batchId = String(body.batchId);
    const rows = store.studentEnrollments.filter((item) => item.batchId === batchId && item.isCurrent);
    return {
      totalRows: rows.length,
      inserted: rows.length,
      updated: 0,
      errors: [],
      summary: { avgMarks: 74.2, belowPassCount: 1, studentCount: rows.length },
      phase: phase.label,
      subject: subject.code,
    };
  },

  resultsManual(body: { phaseId: string; subjectId: string; batchId: string; results: Array<{ enrollmentId: string; marksObtained: number; maxMarks: number; grade: string }> }) {
    let inserted = 0;
    let updated = 0;
    body.results.forEach((item) => {
      const existing = store.results.find(
        (entry) => entry.enrollmentId === item.enrollmentId && entry.phaseId === body.phaseId && entry.subjectId === body.subjectId,
      );
      if (existing) {
        existing.marksObtained = item.marksObtained;
        existing.maxMarks = item.maxMarks;
        existing.grade = item.grade;
        existing.updatedAt = new Date().toISOString();
        updated += 1;
      } else {
        store.results.push({
          id: `res_${Date.now()}_${inserted}`,
          enrollmentId: item.enrollmentId,
          phaseId: body.phaseId,
          subjectId: body.subjectId,
          batchId: body.batchId,
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks,
          grade: item.grade,
          isPublished: false,
          publishedAt: null,
          uploadedBy: "fac_001",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        inserted += 1;
      }
    });
    return {
      inserted,
      updated,
      summary: {
        avgMarks: average(body.results.map((item) => item.marksObtained)),
        belowPassCount: body.results.filter((item) => item.marksObtained < 40).length,
      },
    };
  },

  resultsPreview(phaseId: string, subjectId: string, batchId: string) {
    const rows = store.results.filter(
      (item) => item.phaseId === phaseId && item.subjectId === subjectId && item.batchId === batchId,
    );
    return {
      studentCount: rows.length,
      avgMarks: average(rows.map((item) => item.marksObtained)),
      belowPassCount: rows.filter((item) => item.marksObtained < 40).length,
      isPublished: rows.every((item) => item.isPublished),
      results: rows.map((item) => {
        const enrollment = enrollmentById(item.enrollmentId);
        const student = store.students.find((entry) => entry.id === enrollment.studentId)!;
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          marksObtained: item.marksObtained,
          maxMarks: item.maxMarks,
          grade: item.grade,
          status: item.marksObtained < 40 ? "Fail" : "Pass",
        };
      }),
    };
  },

  resultsPublish(phaseId: string, subjectId: string, batchId: string) {
    const rows = store.results.filter(
      (item) => item.phaseId === phaseId && item.subjectId === subjectId && item.batchId === batchId,
    );
    if (rows.length === 0) {
      throw new ApiError(400, "INCOMPLETE_RESULTS", "No result rows available to publish.");
    }
    if (rows.every((item) => item.isPublished)) {
      throw new ApiError(409, "RESULTS_ALREADY_PUBLISHED", "Results already published.");
    }
    const publishedAt = new Date().toISOString();
    rows.forEach((item) => {
      item.isPublished = true;
      item.publishedAt = publishedAt;
      item.updatedAt = publishedAt;
    });
    return { published: true, publishedAt, studentCount: rows.length };
  },

  resultsUploadHistory(scope: Scope, page = 1, limit = 10) {
    const rows = latestResults(scope)
      .map((item) => ({
        phase: phaseById(item.phaseId).label,
        subjectCode: subjectById(item.subjectId).code,
        batchCode: batchById(item.batchId).code,
        uploadedAt: item.createdAt,
        uploadedBy: facultyById(item.uploadedBy).name,
        studentCount: store.results.filter((entry) => entry.phaseId === item.phaseId && entry.subjectId === item.subjectId && entry.batchId === item.batchId).length,
      }));
    return paginate(rows, page, limit);
  },

  resultsPhaseStatus(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const subjectsTotal = store.subjects.filter((item) => item.semesterId === semester.id).length;
    return {
      phases: store.phases
        .filter((item) => item.semesterId === semester.id)
        .map((phase) => {
          const subjectsUploaded = new Set(
            latestResults(scope, undefined, phase.id).map((item) => item.subjectId),
          ).size;
          return {
            phase: phase.label,
            subjectsTotal,
            subjectsUploaded,
            status: subjectsUploaded === 0 ? "Pending" : subjectsUploaded === subjectsTotal ? "Complete" : "In Progress",
          };
        }),
    };
  },

  updateResult(resultId: string, marksObtained: number, grade: string) {
    const result = store.results.find((item) => item.id === resultId);
    if (!result) {
      throw new ApiError(404, "NOT_FOUND", "Result not found.");
    }
    result.marksObtained = marksObtained;
    result.grade = grade;
    result.updatedAt = new Date().toISOString();
    return {
      id: result.id,
      marksObtained: result.marksObtained,
      grade: result.grade,
      updatedAt: result.updatedAt,
    };
  },

  deleteResult(resultId: string) {
    store.results = store.results.filter((item) => item.id !== resultId);
  },

  attendanceSummary(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const records = store.attendanceRecords.filter(
      (item) => item.semesterId === semester.id && scope.hodBatchIds.includes(item.batchId),
    );
    const percentages = records.map((item) => percentage(item));
    return {
      overallAvgPct: average(percentages),
      deltaLabel: "+2.1% this month",
      belowThresholdCount: percentages.filter((item) => item < store.attendanceRules.minThresholdPct).length,
      totalLectures: records.reduce((sum, item) => sum + item.totalLectures, 0),
      lockedRecordsPct: records.length === 0 ? 0 : Math.round((records.filter((item) => item.isLocked).length / records.length) * 100),
    };
  },

  attendanceHeatmap(scope: Scope, batchId: string, semesterId: string) {
    ensureBatchInScope(batchId, scope);
    const subjects = store.subjects.filter((item) => item.semesterId === semesterId).map((item) => item.code);
    const students = store.studentEnrollments
      .filter((item) => item.batchId === batchId && item.semesterId === semesterId && item.isCurrent)
      .map((enrollment) => {
        const student = store.students.find((item) => item.id === enrollment.studentId)!;
        const perSubjectPct = store.subjects
          .filter((item) => item.semesterId === semesterId)
          .map((subject) => {
            const record = store.attendanceRecords.find((item) => item.enrollmentId === enrollment.id && item.subjectId === subject.id);
            return record ? Math.round(percentage(record)) : 0;
          });
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          perSubjectPct,
          avgPct: Math.round(average(perSubjectPct)),
        };
      });
    return { subjects, students };
  },

  attendanceTable(scope: Scope, batchId: string, semesterId: string, search?: string, page = 1, limit = 20) {
    ensureBatchInScope(batchId, scope);
    const rows = store.studentEnrollments
      .filter((item) => item.batchId === batchId && item.semesterId === semesterId && item.isCurrent)
      .map((enrollment) => {
        const student = store.students.find((item) => item.id === enrollment.studentId)!;
        const perSubjectEntries = store.subjects
          .filter((item) => item.semesterId === semesterId)
          .map((subject) => {
            const record = store.attendanceRecords.find((item) => item.enrollmentId === enrollment.id && item.subjectId === subject.id);
            return [subject.code, record ? Math.round(percentage(record)) : 0] as const;
          });
        const avgPct = Math.round(average(perSubjectEntries.map((item) => item[1])));
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          perSubject: Object.fromEntries(perSubjectEntries),
          avgPct,
          status: avgPct < 75 ? "AT_RISK" : "ACTIVE",
          isLocked: allAttendanceForEnrollment(enrollment.id, semesterId).every((item) => item.isLocked),
        };
      })
      .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.enrollmentNo.includes(search));
    return paginate(rows, page, limit);
  },

  attendanceBySubject(scope: Scope, batchId: string, semesterId: string) {
    ensureBatchInScope(batchId, scope);
    return {
      subjects: store.subjects
        .filter((item) => item.semesterId === semesterId)
        .map((subject) => {
          const records = store.attendanceRecords.filter((item) => item.batchId === batchId && item.semesterId === semesterId && item.subjectId === subject.id);
          return { code: subject.code, avgPct: Math.round(average(records.map((item) => percentage(item)))) };
        }),
    };
  },

  facultyAttendance(body: { subjectId: string; batchId: string; lectureDate: string; attendance: Array<{ enrollmentId: string; isPresent: boolean }> }, facultyId: string) {
    const assignment = store.facultyBatchAssignments.find(
      (item) => item.facultyId === facultyId && item.batchId === body.batchId && item.subjectId === body.subjectId,
    );
    if (!assignment) {
      throw new ApiError(403, "NOT_ASSIGNED_TO_BATCH", "Faculty is not assigned to this batch.");
    }
    body.attendance.forEach((item) => {
      const record = store.attendanceRecords.find(
        (entry) => entry.enrollmentId === item.enrollmentId && entry.subjectId === body.subjectId,
      );
      if (record?.isLocked) {
        throw new ApiError(409, "ATTENDANCE_RECORD_LOCKED", "Attendance record is locked.");
      }
      if (record) {
        record.totalLectures += 1;
        record.attendedLectures += item.isPresent ? 1 : 0;
        record.updatedAt = new Date().toISOString();
      } else {
        const enrollment = enrollmentById(item.enrollmentId);
        store.attendanceRecords.push({
          id: `att_${Date.now()}`,
          enrollmentId: item.enrollmentId,
          subjectId: body.subjectId,
          batchId: body.batchId,
          semesterId: enrollment.semesterId,
          totalLectures: 1,
          attendedLectures: item.isPresent ? 1 : 0,
          isLocked: false,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    return { recordsCreated: body.attendance.length, lectureDate: body.lectureDate, subjectCode: subjectById(body.subjectId).code };
  },

  lockAttendance(subjectId: string, batchId: string, semesterId: string) {
    const rows = store.attendanceRecords.filter(
      (item) => item.subjectId === subjectId && item.batchId === batchId && item.semesterId === semesterId,
    );
    rows.forEach((item) => {
      item.isLocked = true;
    });
    return { lockedCount: rows.length, isLocked: true };
  },

  unlockAttendance(enrollmentId: string, subjectId: string) {
    const record = store.attendanceRecords.find((item) => item.enrollmentId === enrollmentId && item.subjectId === subjectId);
    if (!record) {
      throw new ApiError(404, "NOT_FOUND", "Attendance record not found.");
    }
    record.isLocked = false;
    const student = store.students.find((item) => item.id === enrollmentById(enrollmentId).studentId)!;
    return { enrollmentNo: student.enrollmentNo, isLocked: false };
  },

  lockAllAttendance(batchId: string, semesterId: string) {
    const rows = store.attendanceRecords.filter((item) => item.batchId === batchId && item.semesterId === semesterId);
    rows.forEach((item) => {
      item.isLocked = true;
    });
    return { lockedCount: rows.length };
  },

  attendanceExport(scope: Scope, batchId: string, semesterId: string) {
    const table = this.attendanceTable(scope, batchId, semesterId, undefined, 1, 1000).data;
    const subjectCodes = store.subjects.filter((item) => item.semesterId === semesterId).map((item) => item.code);
    const lines = [[ "enrollment_no", "name", ...subjectCodes, "avg_pct", "status" ].join(",")];
    table.forEach((row) => {
      lines.push([row.enrollmentNo, row.name, ...subjectCodes.map((code) => row.perSubject[code] ?? 0), row.avgPct, row.status].join(","));
    });
    return lines.join("\n");
  },

  studentAttendance(userId: string, semesterId?: string) {
    const student = store.students.find((item) => item.id === userId);
    if (!student) {
      throw new ApiError(404, "NOT_FOUND", "Student not found.");
    }
    const semester = getSemester(semesterId, student.universityId);
    const enrollment = currentEnrollmentForStudent(student.id, semester.id);
    if (!enrollment) {
      return { subjects: [] };
    }
    return {
      subjects: store.subjects
        .filter((item) => item.semesterId === semester.id)
        .map((subject) => {
          const record = store.attendanceRecords.find((item) => item.enrollmentId === enrollment.id && item.subjectId === subject.id);
          const totalLectures = record?.totalLectures ?? 0;
          const attended = record?.attendedLectures ?? 0;
          const pct = totalLectures === 0 ? 0 : Number(((attended / totalLectures) * 100).toFixed(2));
          return {
            subjectCode: subject.code,
            totalLectures,
            attended,
            percentage: pct,
            isBelowThreshold: pct < store.attendanceRules.minThresholdPct,
          };
        }),
    };
  },

  listSubjects(scope: Scope, semesterId?: string, search?: string, type?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const data = store.subjects
      .filter((item) => item.semesterId === semester.id)
      .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.code.toLowerCase().includes(search.toLowerCase()))
      .filter((item) => !type || item.type === type)
      .map((subject) => {
        const assignments = store.facultyBatchAssignments.filter((item) => item.subjectId === subject.id);
        const assignedFacultyId = assignments[0]?.facultyId;
        return {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
          type: subject.type,
          assignedFaculty: assignedFacultyId ? { id: assignedFacultyId, name: facultyById(assignedFacultyId).name } : null,
          batches: assignments.map((item) => batchById(item.batchId).code),
          pyqUploaded: subject.pyqUploaded,
        };
      });
    return {
      data,
      summary: {
        totalSubjects: data.length,
        totalCredits: data.reduce((sum, item) => sum + item.credits, 0),
        assignedCount: data.filter((item) => item.assignedFaculty).length,
        unassignedCount: data.filter((item) => !item.assignedFaculty).length,
      },
    };
  },

  getSubject(subjectId: string) {
    return subjectById(subjectId);
  },

  createSubject(body: { semesterId: string; code: string; name: string; credits: number; type: string; facultyId?: string; batchIds?: string[] }) {
    if (store.subjects.some((item) => item.semesterId === body.semesterId && item.code === body.code)) {
      throw new ApiError(409, "SUBJECT_CODE_EXISTS_IN_SEMESTER", "Subject code already exists in semester.");
    }
    const subject: Subject = {
      id: `subj_${Date.now()}`,
      semesterId: body.semesterId,
      code: body.code,
      name: body.name,
      credits: body.credits,
      type: body.type,
      pyqUploaded: false,
    };
    store.subjects.push(subject);
    if (body.facultyId && body.batchIds?.length) {
      body.batchIds.forEach((batchId, index) => {
        store.facultyBatchAssignments.push({
          id: `fba_${Date.now()}_${index}`,
          facultyId: body.facultyId!,
          subjectId: subject.id,
          batchId,
          semesterId: body.semesterId,
        });
      });
    }
    return { id: subject.id, code: subject.code, name: subject.name };
  },

  updateSubject(subjectId: string, body: { code: string; name: string; credits: number; type: string }) {
    const subject = subjectById(subjectId);
    subject.code = body.code;
    subject.name = body.name;
    subject.credits = body.credits;
    subject.type = body.type;
    return subject;
  },

  deleteSubject(subjectId: string) {
    if (store.results.some((item) => item.subjectId === subjectId) || store.attendanceRecords.some((item) => item.subjectId === subjectId)) {
      throw new ApiError(409, "SUBJECT_HAS_RESULTS_OR_ATTENDANCE", "Subject has dependent data.");
    }
    store.subjects = store.subjects.filter((item) => item.id !== subjectId);
  },

  copySubjects(fromSemesterId: string, toSemesterId: string) {
    const source = store.subjects.filter((item) => item.semesterId === fromSemesterId);
    let copiedCount = 0;
    let skippedCount = 0;
    source.forEach((item) => {
      if (store.subjects.some((entry) => entry.semesterId === toSemesterId && entry.code === item.code)) {
        skippedCount += 1;
        return;
      }
      store.subjects.push({
        ...item,
        id: `${item.id}_${Date.now()}_${copiedCount}`,
        semesterId: toSemesterId,
      });
      copiedCount += 1;
    });
    return { copiedCount, skippedCount };
  },

  uploadPyq(subjectId: string) {
    const subject = subjectById(subjectId);
    subject.pyqUploaded = true;
    return { uploaded: 1, subjectId: subject.id, processingStatus: "queued" };
  },

  mentorshipSummary(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const students = scopedCurrentEnrollments(scope, semester.id);
    const assignments = store.mentorAssignments.filter((item) => item.semesterId === semester.id);
    const activeMentors = new Set(assignments.map((item) => item.facultyId)).size;
    const assignedStudentIds = new Set(assignments.map((item) => item.studentId));
    return {
      activeMentors,
      studentsAssigned: assignments.length,
      unassignedStudents: students.filter((item) => !assignedStudentIds.has(item.studentId)).length,
      avgMenteesPerMentor: activeMentors === 0 ? 0 : Number((assignments.length / activeMentors).toFixed(1)),
    };
  },

  mentorshipMentors(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const assignments = store.mentorAssignments.filter((item) => item.semesterId === semester.id);
    const data = getScopedFaculty(scope)
      .filter((item) => !item.isHod && item.mentorCode)
      .map((faculty) => {
        const mentees = assignments
          .filter((item) => item.facultyId === faculty.id)
          .map((item) => {
            const student = store.students.find((entry) => entry.id === item.studentId)!;
            return { enrollmentNo: student.enrollmentNo, name: student.name };
          });
        return {
          facultyId: faculty.id,
          name: faculty.name,
          department: faculty.department,
          mentorCode: faculty.mentorCode,
          menteeCount: mentees.length,
          mentees,
        };
      });
    return { data };
  },

  mentorshipAssignments(scope: Scope, query: Record<string, string | number | undefined>) {
    const semester = getSemester(query.semesterId as string | undefined, scope.universityId);
    const rows = store.mentorAssignments
      .filter((item) => item.semesterId === semester.id)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const enrollment = currentEnrollmentForStudent(student.id, semester.id)!;
        const mentor = facultyById(item.facultyId);
        return {
          enrollmentNo: student.enrollmentNo,
          studentName: student.name,
          batchCode: batchById(enrollment.batchId).code,
          mentorName: mentor.name,
          mentorCode: mentor.mentorCode,
        };
      })
      .filter((item) => !query.search || item.studentName.toLowerCase().includes(String(query.search).toLowerCase()) || item.enrollmentNo.includes(String(query.search)))
      .filter((item) => !query.mentorCode || item.mentorCode === query.mentorCode);
    return paginate(rows, Number(query.page ?? 1), Number(query.limit ?? 20));
  },

  mentorshipUnassigned(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const assignedStudentIds = new Set(
      store.mentorAssignments.filter((item) => item.semesterId === semester.id).map((item) => item.studentId),
    );
    const data = scopedCurrentEnrollments(scope, semester.id)
      .filter((item) => !assignedStudentIds.has(item.studentId))
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          batchCode: batchById(item.batchId).code,
          branch: student.branch,
        };
      });
    return { data, total: data.length };
  },

  assignMentor(studentEnrollmentNo: string, facultyId: string, semesterId: string) {
    const student = studentByEnrollmentNo(studentEnrollmentNo);
    const faculty = facultyById(facultyId);
    if (faculty.isHod) {
      throw new ApiError(400, "CANNOT_ASSIGN_TO_HOD", "Cannot assign mentor to HOD.");
    }
    if (getMentorAssignment(student.id, semesterId)) {
      throw new ApiError(409, "STUDENT_ALREADY_HAS_MENTOR_THIS_SEMESTER", "Student already assigned.");
    }
    const assignment: MentorAssignment = {
      id: `ma_${Date.now()}`,
      studentId: student.id,
      facultyId,
      semesterId,
      createdAt: new Date().toISOString(),
    };
    store.mentorAssignments.push(assignment);
    return {
      id: assignment.id,
      mentorCode: faculty.mentorCode,
      student: { enrollmentNo: student.enrollmentNo, name: student.name },
      faculty: { id: faculty.id, name: faculty.name },
    };
  },

  assignMentorCsv() {
    return { assigned: 2, errors: [] };
  },

  reassignMentor(studentEnrollmentNo: string, newFacultyId: string, semesterId: string) {
    const student = studentByEnrollmentNo(studentEnrollmentNo);
    const existing = getMentorAssignment(student.id, semesterId);
    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", "Mentor assignment not found.");
    }
    existing.facultyId = newFacultyId;
    return { enrollmentNo: student.enrollmentNo, newMentorCode: facultyById(newFacultyId).mentorCode };
  },

  autoAssignMentors(scope: Scope, semesterId: string) {
    const unassigned = this.mentorshipUnassigned(scope, semesterId).data;
    const mentors = getScopedFaculty(scope).filter((item) => !item.isHod && item.mentorCode);
    const distribution = mentors.map((item) => ({ mentorCode: item.mentorCode!, newCount: 0 }));
    unassigned.forEach((studentRow, index) => {
      const mentor = mentors[index % mentors.length];
      this.assignMentor(studentRow.enrollmentNo, mentor.id, semesterId);
      distribution[index % mentors.length].newCount += 1;
    });
    return { assignedCount: unassigned.length, distribution };
  },

  deleteMentorAssignment(assignmentId: string) {
    store.mentorAssignments = store.mentorAssignments.filter((item) => item.id !== assignmentId);
  },

  analyticsKpi(scope: Scope, batchId?: string) {
    const phase = currentPhaseForSemester(getActiveSemester(scope.universityId).id) ?? store.phases[0];
    const rows = latestResults(scope, batchId, phase.id);
    const enrollments = scopedCurrentEnrollments(scope).filter((item) => !batchId || item.batchId === batchId);
    const topEnrollment = [...enrollments].sort((left, right) => right.avgMarksPct - left.avgMarksPct)[0];
    const topStudent = topEnrollment ? store.students.find((item) => item.id === topEnrollment.studentId)! : null;
    const passRate = rows.length === 0 ? 0 : Number((((rows.filter((item) => item.marksObtained >= 40).length / rows.length) * 100)).toFixed(1));
    return {
      avgAttendance: { value: average(enrollments.map((item) => item.attendancePct)), deltaLabel: "+2.1%" },
      avgMarksLatestPhase: { value: average(rows.map((item) => (item.marksObtained / item.maxMarks) * 100)), phaseLabel: phase.label, deltaLabel: "+3.8%" },
      atRiskCount: { value: enrollments.filter((item) => item.attendancePct < 75 || item.avgMarksPct < 40).length, deltaLabel: "+1 new" },
      passRateLatestPhase: { value: passRate, phaseLabel: phase.label, deltaLabel: "+0.8%" },
      topScorer: topStudent ? { name: topStudent.name, avgPct: topEnrollment.avgMarksPct } : { name: "-", avgPct: 0 },
    };
  },

  analyticsAttendanceTrend(scope: Scope, months = 6) {
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const series = scope.hodBatchIds.slice(0, 2).map((batchId, index) => ({
      batchCode: batchById(batchId).code,
      data: [82 - index * 4, 84 - index * 4, 86 - index * 3, 88 - index * 3, 87 - index * 3, 90 - index * 2].slice(0, months),
    }));
    return { labels: labels.slice(0, months), series };
  },

  analyticsAttendanceBySubject(scope: Scope, semesterId?: string, batchId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    const filtered = this.attendanceBySubject(scope, batchId ?? scope.hodBatchIds[0], semester.id);
    return filtered;
  },

  analyticsAttendanceDistribution(scope: Scope, batchId?: string) {
    const enrollments = scopedCurrentEnrollments(scope).filter((item) => !batchId || item.batchId === batchId);
    const values = enrollments.map((item) => item.attendancePct);
    return {
      buckets: [
        { range: "< 60%", count: values.filter((item) => item < 60).length },
        { range: "60–74%", count: values.filter((item) => item >= 60 && item < 75).length },
        { range: "75–84%", count: values.filter((item) => item >= 75 && item < 85).length },
        { range: "85–94%", count: values.filter((item) => item >= 85 && item < 95).length },
        { range: "≥ 95%", count: values.filter((item) => item >= 95).length },
      ],
    };
  },

  analyticsMarksByPhase(scope: Scope) {
    const phases = store.phases.filter((item) => item.semesterId === getActiveSemester(scope.universityId).id).map((item) => item.label);
    const series = store.subjects
      .filter((item) => item.semesterId === getActiveSemester(scope.universityId).id)
      .slice(0, 2)
      .map((subject) => ({
        subjectCode: subject.code,
        data: store.phases
          .filter((item) => item.semesterId === getActiveSemester(scope.universityId).id)
          .map((phase) => {
            const rows = latestResults(scope, undefined, phase.id).filter((item) => item.subjectId === subject.id);
            return rows.length === 0 ? null : average(rows.map((item) => (item.marksObtained / item.maxMarks) * 100));
          }),
      }));
    return { phases, series };
  },

  analyticsMarksBySubject(scope: Scope, phaseId: string, batchId?: string) {
    return {
      subjects: store.subjects
        .filter((item) => item.semesterId === phaseById(phaseId).semesterId)
        .map((subject) => {
          const rows = latestResults(scope, batchId, phaseId).filter((item) => item.subjectId === subject.id);
          return { code: subject.code, avgMarksPct: rows.length === 0 ? 0 : Math.round(average(rows.map((item) => (item.marksObtained / item.maxMarks) * 100))) };
        }),
    };
  },

  analyticsGradeDistribution(scope: Scope, phaseId: string, batchId?: string) {
    const rows = latestResults(scope, batchId, phaseId);
    const grades = rows.map((item) => item.grade);
    return {
      buckets: [
        { grade: "A+ (≥90)", count: grades.filter((item) => item === "A+").length },
        { grade: "A (80–89)", count: grades.filter((item) => item === "A").length },
        { grade: "B (70–79)", count: grades.filter((item) => item === "B").length },
        { grade: "C (60–69)", count: grades.filter((item) => item === "C").length },
        { grade: "D (50–59)", count: grades.filter((item) => item === "D").length },
        { grade: "F (<50)", count: grades.filter((item) => item === "F").length },
      ],
    };
  },

  analyticsLeaderboard(scope: Scope, phaseId: string, batchId?: string, limit = 10) {
    const rows = scopedCurrentEnrollments(scope)
      .filter((item) => !batchId || item.batchId === batchId)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const batch = batchById(item.batchId);
        const subjectRows = store.results.filter((entry) => entry.enrollmentId === item.id && entry.phaseId === phaseId);
        const avgPct = subjectRows.length === 0 ? item.avgMarksPct : average(subjectRows.map((entry) => (entry.marksObtained / entry.maxMarks) * 100));
        return { enrollmentNo: student.enrollmentNo, name: student.name, batchCode: batch.code, avgPct };
      })
      .sort((left, right) => right.avgPct - left.avgPct)
      .slice(0, limit)
      .map((item, index) => ({ rank: index + 1, ...item }));
    return { data: rows };
  },

  analyticsPerformanceRadar(scope: Scope, phaseId: string) {
    const subjectCodes = store.subjects.filter((item) => item.semesterId === phaseById(phaseId).semesterId).map((item) => item.code);
    return {
      subjects: subjectCodes,
      topAvg: [88, 91, 85, 93, 87].slice(0, subjectCodes.length),
      bottomAvg: [52, 55, 48, 60, 50].slice(0, subjectCodes.length),
    };
  },

  analyticsAtRisk(scope: Scope, query: Record<string, string | number | undefined>) {
    const rows = scopedCurrentEnrollments(scope)
      .map((item) => {
        const student = store.students.find((entry) => entry.id === item.studentId)!;
        const mentor = getMentorAssignment(student.id, item.semesterId);
        const mentorCode = mentor ? facultyById(mentor.facultyId).mentorCode : null;
        const riskFactor = item.attendancePct < 75 && item.avgMarksPct < 40 ? "BOTH" : item.attendancePct < 75 ? "ATTENDANCE" : "MARKS";
        return {
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          batchCode: batchById(item.batchId).code,
          mentorCode,
          avgAttendancePct: item.attendancePct,
          latestPhaseMarksPct: item.avgMarksPct,
          riskFactor,
        };
      })
      .filter((item) => item.avgAttendancePct < 75 || item.latestPhaseMarksPct < 40)
      .filter((item) => !query.batchId || batchById(scopedCurrentEnrollments(scope).find((entry) => store.students.find((student) => student.id === entry.studentId)?.enrollmentNo === item.enrollmentNo)!.batchId).id === query.batchId)
      .filter((item) => !query.riskFactor || item.riskFactor === query.riskFactor);
    return paginate(rows, Number(query.page ?? 1), Number(query.limit ?? 20));
  },

  notifyAtRiskMentor(enrollmentNo: string) {
    const student = studentByEnrollmentNo(enrollmentNo);
    const current = currentEnrollmentForStudent(student.id);
    if (!current) {
      throw new ApiError(404, "NOT_FOUND", "Student not found.");
    }
    const assignment = getMentorAssignment(student.id, current.semesterId);
    return { notified: Boolean(assignment), mentorCode: assignment ? facultyById(assignment.facultyId).mentorCode : null };
  },

  analyticsYearComparison() {
    return {
      subjects: ["COA", "DM", "FCSP-2", "FSD-2", "TOC"],
      current: { label: "2026-27", data: [72, 78, 65, 81, 69] },
      compare: { label: "2025-26", data: [68, 72, 64, 75, 67] },
      attendanceComparison: { current: 87.3, compare: 84.2 },
      passRateComparison: { current: 91.2, compare: 88.7 },
    };
  },

  analyticsExport() {
    return Buffer.from("%PDF-1.4\n% UniBridge analytics report placeholder\n");
  },

  promotionYears() {
    return {
      years: store.academicYears.map((item) => ({
        id: item.id,
        label: item.label,
        status: item.status,
        studentCount: store.studentEnrollments.filter((entry) => getSemester(entry.semesterId).academicYearId === item.id).length,
      })),
    };
  },

  promotionPreview(fromAcademicYearId: string, toAcademicYearId: string) {
    const fromYear = getAcademicYear(fromAcademicYearId);
    const toYear = getAcademicYear(toAcademicYearId);
    const groups = store.studentEnrollments
      .filter((item) => item.isCurrent && getSemester(item.semesterId).academicYearId === fromAcademicYearId)
      .reduce<Array<{ yearLevel: YearLevel; targetYearLevel: YearLevel; students: Array<{ enrollmentNo: string; name: string; fromBatchCode: string; fromSemesterLabel: string }>; availableTargetBatches: Array<{ id: string; code: string }> }>>((acc, enrollment) => {
        const student = store.students.find((item) => item.id === enrollment.studentId)!;
        const fromBatch = batchById(enrollment.batchId);
        const targetYearLevel = fromBatch.yearLevel === "FY" ? "SY" : fromBatch.yearLevel === "SY" ? "TY" : fromBatch.yearLevel === "TY" ? "FINAL" : "FINAL";
        let group = acc.find((item) => item.yearLevel === fromBatch.yearLevel);
        if (!group) {
          group = {
            yearLevel: fromBatch.yearLevel,
            targetYearLevel,
            students: [],
            availableTargetBatches: store.batches
              .filter((item) => item.academicYearId === toYear.id && item.yearLevel === targetYearLevel)
              .map((item) => ({ id: item.id, code: item.code })),
          };
          acc.push(group);
        }
        group.students.push({
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          fromBatchCode: fromBatch.code,
          fromSemesterLabel: getSemester(enrollment.semesterId).label,
        });
        return acc;
      }, []);
    return {
      fromYearLabel: fromYear.label,
      toYearLabel: toYear.label,
      groups,
      unmappedCount: 2,
    };
  },

  promotionMappingCsv() {
    return { mapped: 2, errors: [] };
  },

  savePromotionMapping(fromAcademicYearId: string, toAcademicYearId: string, mappings: Array<{ enrollmentNo: string; toBatchId: string }>) {
    const draftId = `draft_${Date.now()}`;
    const draft: PromotionDraft = { id: draftId, fromAcademicYearId, toAcademicYearId, mappings };
    store.promotionDrafts.push(draft);
    return { savedCount: mappings.length, draftId };
  },

  suggestRollNumbers(draftId: string) {
    const draft = store.promotionDrafts.find((item) => item.id === draftId);
    if (!draft) {
      throw new ApiError(404, "NOT_FOUND", "Draft not found.");
    }
    return {
      suggestions: draft.mappings.map((item, index) => ({
        enrollmentNo: item.enrollmentNo,
        suggestedRollNo: item.toRollNo ?? `IT-25-00${index + 1}`,
      })),
    };
  },

  promotionRollCsv() {
    return { assigned: 2, errors: [] };
  },

  promotionPreviewSummary(draftId: string) {
    const draft = store.promotionDrafts.find((item) => item.id === draftId);
    if (!draft) {
      throw new ApiError(404, "NOT_FOUND", "Draft not found.");
    }
    const byBatch = Object.entries(
      draft.mappings.reduce<Record<string, number>>((acc, mapping) => {
        const batchCode = batchById(mapping.toBatchId).code;
        acc[batchCode] = (acc[batchCode] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([toBatchCode, count]) => ({ toBatchCode, count }));
    return {
      totalStudents: draft.mappings.length,
      mappedStudents: draft.mappings.length,
      heldStudents: 0,
      byBatch,
    };
  },

  executePromotion(draftId: string, mappings: Array<{ enrollmentNo: string; fromEnrollmentId: string; toSemesterId: string; toBatchId: string; toRollNo: string }>) {
    const draft = store.promotionDrafts.find((item) => item.id === draftId);
    if (!draft) {
      throw new ApiError(404, "NOT_FOUND", "Draft not found.");
    }
    mappings.forEach((mapping) => {
      const student = studentByEnrollmentNo(mapping.enrollmentNo);
      const current = store.studentEnrollments.find((item) => item.id === mapping.fromEnrollmentId);
      if (current) {
        current.isCurrent = false;
      }
      store.studentEnrollments.push({
        id: `enr_${Date.now()}_${mapping.enrollmentNo}`,
        studentId: student.id,
        semesterId: mapping.toSemesterId,
        batchId: mapping.toBatchId,
        rollNo: mapping.toRollNo,
        isCurrent: true,
        attendancePct: 0,
        avgMarksPct: 0,
        promotedFromEnrollmentId: mapping.fromEnrollmentId,
      });
    });
    return {
      promoted: mappings.length,
      skipped: 0,
      executedAt: new Date().toISOString(),
      executedBy: "Dr. Rajesh Patel",
    };
  },

  promotionHistory(page = 1, limit = 10) {
    return paginate(store.promotionHistory, page, limit);
  },

  calendarEvents(query: Record<string, string | number | undefined>) {
    const rows = store.calendarEvents.filter((event) => {
      if (query.year && query.month) {
        const date = new Date(event.startDate);
        return date.getUTCFullYear() === Number(query.year) && date.getUTCMonth() + 1 === Number(query.month);
      }
      if (query.startDate && query.endDate) {
        return event.startDate >= String(query.startDate) && event.endDate <= String(query.endDate);
      }
      return true;
    });
    return { data: rows.map((item) => ({ id: item.id, date: item.startDate, title: item.title, type: item.type })) };
  },

  upcomingEvents(limit = 6) {
    return {
      data: [...store.calendarEvents]
        .sort((left, right) => left.startDate.localeCompare(right.startDate))
        .slice(0, limit)
        .map((item) => ({ id: item.id, date: item.startDate, title: item.title, type: item.type })),
    };
  },

  getEvent(eventId: string) {
    const event = store.calendarEvents.find((item) => item.id === eventId);
    if (!event) {
      throw new ApiError(404, "NOT_FOUND", "Event not found.");
    }
    return {
      id: event.id,
      title: event.title,
      date: event.date,
      endDate: event.endDate,
      type: event.type,
      description: event.description,
      visibleTo: event.visibleTo,
      createdBy: event.createdBy,
    };
  },

  createEvent(body: Record<string, string>) {
    const event = {
      id: `evt_${Date.now()}`,
      title: String(body.title),
      date: String(body.startDate),
      startDate: String(body.startDate),
      endDate: String(body.endDate),
      type: String(body.type),
      visibleTo: String(body.visibleTo),
      description: body.description ? String(body.description) : null,
      semesterId: body.semesterId ? String(body.semesterId) : null,
      createdBy: "Dr. Rajesh Patel",
    };
    store.calendarEvents.push(event);
    return { id: event.id, title: event.title, startDate: event.startDate };
  },

  updateEvent(eventId: string, body: Record<string, string>) {
    const event = store.calendarEvents.find((item) => item.id === eventId);
    if (!event) {
      throw new ApiError(404, "NOT_FOUND", "Event not found.");
    }
    event.title = body.title ?? event.title;
    event.startDate = body.startDate ?? event.startDate;
    event.endDate = body.endDate ?? event.endDate;
    event.type = body.type ?? event.type;
    event.date = event.startDate;
    return event;
  },

  deleteEvent(eventId: string) {
    store.calendarEvents = store.calendarEvents.filter((item) => item.id !== eventId);
  },

  phaseTimeline(scope: Scope, semesterId?: string) {
    const semester = getSemester(semesterId, scope.universityId);
    return { phases: store.phases.filter((item) => item.semesterId === semester.id).map((item) => ({
      label: item.label,
      startDate: item.startDate,
      endDate: item.endDate,
      examDate: item.examDate,
      isComplete: item.isComplete,
    })) };
  },

  calendarExport() {
    return Buffer.from("%PDF-1.4\n% UniBridge academic calendar placeholder\n");
  },

  settingsProfile(userId: string) {
    const faculty = facultyById(userId);
    return {
      employeeId: faculty.employeeId,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      profilePhotoUrl: faculty.profilePhotoUrl,
    };
  },

  updateSettingsProfile(userId: string, body: Record<string, string>) {
    const faculty = facultyById(userId);
    faculty.name = body.name ?? faculty.name;
    faculty.email = body.email ?? faculty.email;
    faculty.phone = body.phone ?? faculty.phone;
    return this.settingsProfile(userId);
  },

  uploadProfilePhoto(userId: string) {
    const faculty = facultyById(userId);
    faculty.profilePhotoUrl = `https://example.com/profiles/${faculty.id}.jpg`;
    return { profilePhotoUrl: faculty.profilePhotoUrl };
  },

  universitySettings(universityId: string) {
    return getUniversity(universityId);
  },

  updateUniversity(universityId: string, body: Record<string, string>) {
    const university = getUniversity(universityId);
    university.name = body.name ?? university.name;
    university.website = body.website ?? university.website;
    university.contactEmail = body.contactEmail ?? university.contactEmail;
    university.address = body.address ?? university.address;
    university.academicYearPattern = body.academicYearPattern ?? university.academicYearPattern;
    return university;
  },

  addUniversityBranch(universityId: string, code: string, name: string) {
    const university = getUniversity(universityId);
    university.branches.push(code);
    university.branchDetails.push({ code, name });
    return { branches: university.branches };
  },

  academicYears() {
    return {
      data: store.academicYears.map((year) => ({
        id: year.id,
        label: year.label,
        status: year.status,
        semesters: store.semesters
          .filter((item) => item.academicYearId === year.id)
          .map((semester) => ({
            id: semester.id,
            number: semester.number,
            label: semester.label,
            status: semester.status,
          })),
      })),
    };
  },

  createAcademicYear(body: { label: string; startDate: string; endDate: string }) {
    const year: AcademicYear = {
      id: `ay_${Date.now()}`,
      universityId: "univ_lju_01",
      label: body.label,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "DRAFT",
    };
    store.academicYears.push(year);
    return { id: year.id, label: year.label, status: year.status };
  },

  activateAcademicYear(yearId: string) {
    store.academicYears.forEach((item) => {
      item.status = item.id === yearId ? "ACTIVE" : item.status === "ACTIVE" ? "READY" : item.status;
    });
    return { id: yearId, status: "ACTIVE" };
  },

  createSemester(yearId: string, body: { number: number; yearLevel: YearLevel; startDate: string; endDate: string }) {
    const semester: Semester = {
      id: `sem_${Date.now()}`,
      universityId: "univ_lju_01",
      number: body.number,
      label: `Semester ${body.number}`,
      academicYearId: yearId,
      isActive: false,
      yearLevel: body.yearLevel,
      status: "UPCOMING",
      startDate: body.startDate,
      endDate: body.endDate,
    };
    store.semesters.push(semester);
    return { id: semester.id, number: semester.number, label: semester.label };
  },

  notifications(userId: string) {
    return { preferences: store.notificationPreferences[userId] ?? [] };
  },

  updateNotifications(userId: string, preferences: Array<{ key: string; enabled: boolean }>) {
    const existing = store.notificationPreferences[userId] ?? [];
    preferences.forEach((pref) => {
      const item = existing.find((entry) => entry.key === pref.key);
      if (item) {
        item.enabled = pref.enabled;
      }
    });
    store.notificationPreferences[userId] = existing;
    return { preferences: existing };
  },

  changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new ApiError(400, "PASSWORD_TOO_WEAK", "Password must be at least 8 characters.");
    }
    const faculty = facultyById(userId);
    if (faculty.password !== currentPassword) {
      throw new ApiError(401, "CURRENT_PASSWORD_INCORRECT", "Current password is incorrect.");
    }
    faculty.password = newPassword;
    return { message: "Password updated successfully" };
  },

  securitySessions(userId: string) {
    return { data: store.sessions.filter((item) => item.userId === userId) };
  },

  revokeSession(sessionId: string) {
    store.sessions = store.sessions.filter((item) => item.id !== sessionId);
  },

  attendanceRules() {
    return store.attendanceRules;
  },

  updateAttendanceRules(body: typeof store.attendanceRules) {
    store.attendanceRules = body;
    return store.attendanceRules;
  },

  resetMentorAssignments(semesterId: string, confirm: boolean) {
    if (!confirm) {
      throw new ApiError(400, "VALIDATION_ERROR", "Confirmation required.");
    }
    const before = store.mentorAssignments.length;
    store.mentorAssignments = store.mentorAssignments.filter((item) => item.semesterId !== semesterId);
    return { clearedCount: before - store.mentorAssignments.length };
  },

  deleteAttendanceRecords(semesterId: string, confirm: boolean) {
    if (!confirm) {
      throw new ApiError(400, "VALIDATION_ERROR", "Confirmation required.");
    }
    const locked = store.attendanceRecords.filter((item) => item.semesterId === semesterId && item.isLocked);
    if (locked.length > 0) {
      return { deletedCount: 0, blocked: true, reason: `${locked.length} records are locked. Unlock before deleting.` };
    }
    const before = store.attendanceRecords.length;
    store.attendanceRecords = store.attendanceRecords.filter((item) => item.semesterId !== semesterId);
    return { deletedCount: before - store.attendanceRecords.length, blocked: false };
  },

  archiveYear(academicYearId: string) {
    const jobId = `archive_job_${Date.now()}`;
    store.archiveJobs.push({
      jobId,
      academicYearId,
      status: "queued",
      estimatedTimeSeconds: 45,
    });
    return { jobId, status: "queued", estimatedTimeSeconds: 45 };
  },

  archiveStatus(jobId: string) {
    const job = store.archiveJobs.find((item) => item.jobId === jobId);
    if (!job) {
      throw new ApiError(404, "NOT_FOUND", "Archive job not found.");
    }
    return job;
  },
};
