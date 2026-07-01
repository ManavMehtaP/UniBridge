import { store } from "../data/store.js";
import { ApiError, buildPagination } from "../utils/http.js";
export class HodService {
    getMyScope(userId, universityId, hodBatchIds, hodSemesterIds) {
        const hod = this.findHod(userId, universityId);
        const activeSemester = store.semesters.find((item) => hodSemesterIds.includes(item.id) && item.isActive) ??
            store.semesters.find((item) => item.universityId === universityId && item.isActive);
        if (!activeSemester) {
            throw new ApiError(404, "ACTIVE_SEMESTER_NOT_FOUND", "No active semester found.");
        }
        const batches = hodBatchIds
            .map((batchId) => {
            const batch = store.batches.find((item) => item.id === batchId);
            if (!batch) {
                return null;
            }
            const studentCount = store.studentEnrollments.filter((item) => item.batchId === batch.id && item.semesterId === activeSemester.id && item.isCurrent).length;
            return {
                id: batch.id,
                code: batch.code,
                yearLevel: batch.yearLevel,
                studentCount,
            };
        })
            .filter((item) => Boolean(item));
        const totalStudents = batches.reduce((sum, batch) => sum + batch.studentCount, 0);
        const totalFaculty = new Set(store.facultyBatchAssignments
            .filter((item) => hodBatchIds.includes(item.batchId) && hodSemesterIds.includes(item.semesterId))
            .map((item) => item.facultyId)).size;
        return {
            hod: {
                id: hod.id,
                name: hod.name,
                department: hod.department,
                employeeId: hod.employeeId,
            },
            activeSemester: {
                id: activeSemester.id,
                label: activeSemester.label,
                number: activeSemester.number,
            },
            batches,
            totalStudents,
            totalFaculty,
        };
    }
    getDashboardSummary(hodBatchIds, hodSemesterIds) {
        const scopedEnrollments = store.studentEnrollments.filter((item) => hodBatchIds.includes(item.batchId) && item.isCurrent);
        const totalStudents = scopedEnrollments.length;
        const totalFaculty = new Set(store.facultyBatchAssignments
            .filter((item) => hodBatchIds.includes(item.batchId) && hodSemesterIds.includes(item.semesterId))
            .map((item) => item.facultyId)).size;
        const activeBatches = hodBatchIds.length;
        const avgAttendance = totalStudents === 0
            ? 0
            : Number((scopedEnrollments.reduce((sum, item) => sum + item.attendancePct, 0) / totalStudents).toFixed(1));
        const resultsUploadedPct = totalStudents === 0
            ? 0
            : Math.round((scopedEnrollments.filter((item) => item.avgMarksPct > 0).length / totalStudents) * 100);
        return {
            totalStudents: {
                value: totalStudents,
                deltaLabel: `Across ${activeBatches} scoped batches`,
                trend: "neutral",
            },
            totalFaculty: {
                value: totalFaculty,
                deltaLabel: `${totalFaculty} assigned this semester`,
                trend: "neutral",
            },
            activeBatches: {
                value: activeBatches,
                deltaLabel: hodBatchIds
                    .map((batchId) => store.batches.find((item) => item.id === batchId)?.code)
                    .filter((code) => Boolean(code))
                    .join(", "),
                trend: "neutral",
            },
            avgAttendance: {
                value: avgAttendance,
                deltaLabel: "Current semester average",
                trend: "neutral",
            },
            resultsUploadedPct: {
                value: resultsUploadedPct,
                deltaLabel: "Current seeded records",
                trend: "neutral",
            },
        };
    }
    getStudents(params) {
        if (params.batchId && !params.hodBatchIds.includes(params.batchId)) {
            throw new ApiError(403, "BATCH_NOT_IN_SCOPE", "Requested batch is not in this HOD's scope.");
        }
        const currentEnrollments = store.studentEnrollments.filter((item) => item.isCurrent &&
            params.hodBatchIds.includes(item.batchId) &&
            (!params.batchId || item.batchId === params.batchId));
        const enrollmentByStudentId = new Map();
        currentEnrollments.forEach((item) => {
            enrollmentByStudentId.set(item.studentId, item);
        });
        const normalizedSearch = params.search?.trim().toLowerCase();
        const rows = store.students
            .filter((student) => student.universityId === params.universityId && student.isActive)
            .filter((student) => enrollmentByStudentId.has(student.id))
            .map((student) => {
            const enrollment = enrollmentByStudentId.get(student.id);
            const batch = store.batches.find((item) => item.id === enrollment.batchId);
            return {
                enrollmentNo: student.enrollmentNo,
                name: student.name,
                email: student.email,
                batchId: batch.id,
                batchCode: batch.code,
                yearLevel: batch.yearLevel,
                rollNo: enrollment.rollNo,
                attendancePct: enrollment.attendancePct,
                avgMarksPct: enrollment.avgMarksPct,
            };
        })
            .filter((row) => !params.yearLevel || row.yearLevel === params.yearLevel)
            .filter((row) => {
            if (!normalizedSearch) {
                return true;
            }
            return (row.name.toLowerCase().includes(normalizedSearch) ||
                row.enrollmentNo.toLowerCase().includes(normalizedSearch));
        })
            .sort((left, right) => left.name.localeCompare(right.name));
        const total = rows.length;
        const start = (params.page - 1) * params.limit;
        const pagedRows = rows.slice(start, start + params.limit);
        return {
            data: pagedRows,
            ...buildPagination(params.page, params.limit, total),
        };
    }
    findHod(userId, universityId) {
        const hod = store.faculties.find((item) => item.id === userId && item.universityId === universityId && item.isHod);
        if (!hod) {
            throw new ApiError(404, "HOD_NOT_FOUND", "HOD faculty profile not found.");
        }
        return hod;
    }
}
