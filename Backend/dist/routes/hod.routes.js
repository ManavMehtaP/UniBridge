import { Router } from "express";
import multer from "multer";
import { portalService } from "../services/portal.service.js";
import { asyncHandler } from "../utils/http.js";
const upload = multer({ storage: multer.memoryStorage() });
function scopeFrom(req) {
    return {
        universityId: req.user.universityId,
        hodBatchIds: req.hodBatchIds ?? [],
        hodSemesterIds: req.hodSemesterIds ?? [],
        userId: req.user.id,
    };
}
function sendCsv(res, filename, body) {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(body);
}
function sendPdf(res, filename, body) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(body);
}
function str(value) {
    return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}
export const hodRouter = Router();
hodRouter.get("/my-scope", asyncHandler(async (req, res) => res.json(portalService.myScope(scopeFrom(req)))));
hodRouter.get("/dashboard/summary", asyncHandler(async (req, res) => res.json(portalService.dashboardSummary(scopeFrom(req)))));
hodRouter.get("/dashboard/attendance-trend", asyncHandler(async (req, res) => res.json(portalService.dashboardAttendanceTrend(scopeFrom(req), Number(req.query.months ?? 6)))));
hodRouter.get("/dashboard/results-overview", asyncHandler(async (req, res) => res.json(portalService.dashboardResultsOverview(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/dashboard/at-risk", asyncHandler(async (req, res) => res.json(portalService.dashboardAtRisk(scopeFrom(req), Number(req.query.limit ?? 5)))));
hodRouter.get("/dashboard/activity-feed", asyncHandler(async (req, res) => res.json(portalService.dashboardActivityFeed(scopeFrom(req), Number(req.query.page ?? 1), Number(req.query.limit ?? 10)))));
hodRouter.get("/students", asyncHandler(async (req, res) => res.json(portalService.listStudents(scopeFrom(req), req.query))));
hodRouter.get("/students/:enrollmentNo", asyncHandler(async (req, res) => res.json(portalService.getStudent(scopeFrom(req), str(req.params.enrollmentNo)))));
hodRouter.get("/students/:enrollmentNo/history", asyncHandler(async (req, res) => res.json(portalService.getStudentHistory(scopeFrom(req), str(req.params.enrollmentNo)))));
hodRouter.post("/students", asyncHandler(async (req, res) => res.status(201).json(portalService.createStudent(req.body))));
hodRouter.put("/students/:enrollmentNo", asyncHandler(async (req, res) => res.json(portalService.updateStudent(scopeFrom(req), str(req.params.enrollmentNo), req.body))));
hodRouter.patch("/students/:enrollmentNo/status", asyncHandler(async (req, res) => res.json(portalService.updateStudentStatus(str(req.params.enrollmentNo), Boolean(req.body.isActive)))));
hodRouter.delete("/students/:enrollmentNo", asyncHandler(async (req, res) => {
    portalService.deleteStudent(str(req.params.enrollmentNo));
    res.status(204).send();
}));
hodRouter.post("/students/csv", upload.single("file"), asyncHandler(async (_req, res) => res.json(portalService.studentCsvUpload())));
hodRouter.get("/students/csv/template", asyncHandler(async (_req, res) => sendCsv(res, "students-template.csv", portalService.studentCsvTemplate())));
hodRouter.get("/students/export", asyncHandler(async (req, res) => sendCsv(res, "students.csv", portalService.studentExport(scopeFrom(req)))));
hodRouter.get("/faculty", asyncHandler(async (req, res) => res.json(portalService.listFaculty(scopeFrom(req), req.query))));
hodRouter.get("/faculty/:employeeId", asyncHandler(async (req, res) => res.json(portalService.getFaculty(scopeFrom(req), str(req.params.employeeId)))));
hodRouter.post("/faculty", asyncHandler(async (req, res) => res.status(201).json(portalService.createFaculty(req.body))));
hodRouter.put("/faculty/:employeeId", asyncHandler(async (req, res) => res.json(portalService.updateFaculty(str(req.params.employeeId), req.body))));
hodRouter.patch("/faculty/:employeeId/mentor-code", asyncHandler(async (req, res) => res.json(portalService.updateMentorCode(str(req.params.employeeId), req.body.mentorCode))));
hodRouter.patch("/faculty/:employeeId/status", asyncHandler(async (req, res) => res.json(portalService.updateFacultyStatus(str(req.params.employeeId), Boolean(req.body.isActive)))));
hodRouter.delete("/faculty/:employeeId", asyncHandler(async (req, res) => {
    portalService.deleteFaculty(str(req.params.employeeId));
    res.status(204).send();
}));
hodRouter.post("/faculty/csv", upload.single("file"), asyncHandler(async (_req, res) => res.json(portalService.facultyCsvUpload())));
hodRouter.post("/faculty/assignments", asyncHandler(async (req, res) => res.status(201).json(portalService.createFacultyAssignment(req.body))));
hodRouter.delete("/faculty/assignments/:assignmentId", asyncHandler(async (req, res) => {
    portalService.deleteFacultyAssignment(str(req.params.assignmentId));
    res.status(204).send();
}));
hodRouter.get("/faculty/export", asyncHandler(async (req, res) => sendCsv(res, "faculty.csv", portalService.facultyExport(scopeFrom(req)))));
hodRouter.get("/results/upload-context", asyncHandler(async (req, res) => res.json(portalService.resultsUploadContext(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/results/students", asyncHandler(async (req, res) => res.json(portalService.resultsStudents(scopeFrom(req), String(req.query.semesterId), String(req.query.batchId), String(req.query.subjectId)))));
hodRouter.post("/results/upload", upload.single("file"), asyncHandler(async (req, res) => res.json(portalService.resultsUpload(req.body))));
hodRouter.post("/results/manual", asyncHandler(async (req, res) => res.json(portalService.resultsManual(req.body))));
hodRouter.get("/results/preview", asyncHandler(async (req, res) => res.json(portalService.resultsPreview(String(req.query.phaseId), String(req.query.subjectId), String(req.query.batchId)))));
hodRouter.post("/results/publish", asyncHandler(async (req, res) => res.json(portalService.resultsPublish(String(req.body.phaseId), String(req.body.subjectId), String(req.body.batchId)))));
hodRouter.get("/results/upload-history", asyncHandler(async (req, res) => res.json(portalService.resultsUploadHistory(scopeFrom(req), Number(req.query.page ?? 1), Number(req.query.limit ?? 10)))));
hodRouter.get("/results/phase-status", asyncHandler(async (req, res) => res.json(portalService.resultsPhaseStatus(scopeFrom(req), req.query.semesterId))));
hodRouter.patch("/results/:resultId", asyncHandler(async (req, res) => res.json(portalService.updateResult(str(req.params.resultId), Number(req.body.marksObtained), String(req.body.grade)))));
hodRouter.delete("/results/:resultId", asyncHandler(async (req, res) => {
    portalService.deleteResult(str(req.params.resultId));
    res.status(204).send();
}));
hodRouter.get("/attendance/summary", asyncHandler(async (req, res) => res.json(portalService.attendanceSummary(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/attendance/heatmap", asyncHandler(async (req, res) => res.json(portalService.attendanceHeatmap(scopeFrom(req), String(req.query.batchId), String(req.query.semesterId)))));
hodRouter.get("/attendance/table", asyncHandler(async (req, res) => res.json(portalService.attendanceTable(scopeFrom(req), String(req.query.batchId), String(req.query.semesterId), req.query.search, Number(req.query.page ?? 1), Number(req.query.limit ?? 20)))));
hodRouter.get("/attendance/by-subject", asyncHandler(async (req, res) => res.json(portalService.attendanceBySubject(scopeFrom(req), String(req.query.batchId), String(req.query.semesterId)))));
hodRouter.patch("/attendance/lock", asyncHandler(async (req, res) => res.json(portalService.lockAttendance(String(req.body.subjectId), String(req.body.batchId), String(req.body.semesterId)))));
hodRouter.patch("/attendance/unlock", asyncHandler(async (req, res) => res.json(portalService.unlockAttendance(String(req.body.enrollmentId), String(req.body.subjectId)))));
hodRouter.patch("/attendance/lock-all", asyncHandler(async (req, res) => res.json(portalService.lockAllAttendance(String(req.body.batchId), String(req.body.semesterId)))));
hodRouter.get("/attendance/export", asyncHandler(async (req, res) => sendCsv(res, "attendance.csv", portalService.attendanceExport(scopeFrom(req), String(req.query.batchId), String(req.query.semesterId)))));
hodRouter.get("/subjects", asyncHandler(async (req, res) => res.json(portalService.listSubjects(scopeFrom(req), req.query.semesterId, req.query.search, req.query.type))));
hodRouter.get("/subjects/:subjectId", asyncHandler(async (req, res) => res.json(portalService.getSubject(str(req.params.subjectId)))));
hodRouter.post("/subjects", asyncHandler(async (req, res) => res.status(201).json(portalService.createSubject(req.body))));
hodRouter.put("/subjects/:subjectId", asyncHandler(async (req, res) => res.json(portalService.updateSubject(str(req.params.subjectId), req.body))));
hodRouter.delete("/subjects/:subjectId", asyncHandler(async (req, res) => {
    portalService.deleteSubject(str(req.params.subjectId));
    res.status(204).send();
}));
hodRouter.post("/subjects/copy", asyncHandler(async (req, res) => res.json(portalService.copySubjects(String(req.body.fromSemesterId), String(req.body.toSemesterId)))));
hodRouter.post("/subjects/:subjectId/pyq", upload.array("files"), asyncHandler(async (req, res) => res.json(portalService.uploadPyq(str(req.params.subjectId)))));
hodRouter.get("/mentorship/summary", asyncHandler(async (req, res) => res.json(portalService.mentorshipSummary(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/mentorship/mentors", asyncHandler(async (req, res) => res.json(portalService.mentorshipMentors(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/mentorship/assignments", asyncHandler(async (req, res) => res.json(portalService.mentorshipAssignments(scopeFrom(req), req.query))));
hodRouter.get("/mentorship/unassigned", asyncHandler(async (req, res) => res.json(portalService.mentorshipUnassigned(scopeFrom(req), req.query.semesterId))));
hodRouter.post("/mentorship/assign", asyncHandler(async (req, res) => res.status(201).json(portalService.assignMentor(String(req.body.studentEnrollmentNo), String(req.body.facultyId), String(req.body.semesterId)))));
hodRouter.post("/mentorship/assign/csv", upload.single("file"), asyncHandler(async (_req, res) => res.json(portalService.assignMentorCsv())));
hodRouter.patch("/mentorship/reassign", asyncHandler(async (req, res) => res.json(portalService.reassignMentor(String(req.body.studentEnrollmentNo), String(req.body.newFacultyId), String(req.body.semesterId)))));
hodRouter.post("/mentorship/auto-assign", asyncHandler(async (req, res) => res.json(portalService.autoAssignMentors(scopeFrom(req), String(req.body.semesterId)))));
hodRouter.delete("/mentorship/assignments/:assignmentId", asyncHandler(async (req, res) => {
    portalService.deleteMentorAssignment(str(req.params.assignmentId));
    res.status(204).send();
}));
hodRouter.get("/analytics/kpi", asyncHandler(async (req, res) => res.json(portalService.analyticsKpi(scopeFrom(req), req.query.batchId))));
hodRouter.get("/analytics/attendance/trend", asyncHandler(async (req, res) => res.json(portalService.analyticsAttendanceTrend(scopeFrom(req), Number(req.query.months ?? 6)))));
hodRouter.get("/analytics/attendance/by-subject", asyncHandler(async (req, res) => res.json(portalService.analyticsAttendanceBySubject(scopeFrom(req), req.query.semesterId, req.query.batchId))));
hodRouter.get("/analytics/attendance/distribution", asyncHandler(async (req, res) => res.json(portalService.analyticsAttendanceDistribution(scopeFrom(req), req.query.batchId))));
hodRouter.get("/analytics/marks/by-phase", asyncHandler(async (req, res) => res.json(portalService.analyticsMarksByPhase(scopeFrom(req)))));
hodRouter.get("/analytics/marks/by-subject", asyncHandler(async (req, res) => res.json(portalService.analyticsMarksBySubject(scopeFrom(req), String(req.query.phaseId), req.query.batchId))));
hodRouter.get("/analytics/marks/grade-distribution", asyncHandler(async (req, res) => res.json(portalService.analyticsGradeDistribution(scopeFrom(req), String(req.query.phaseId), req.query.batchId))));
hodRouter.get("/analytics/leaderboard", asyncHandler(async (req, res) => res.json(portalService.analyticsLeaderboard(scopeFrom(req), String(req.query.phaseId), req.query.batchId, Number(req.query.limit ?? 10)))));
hodRouter.get("/analytics/performance-radar", asyncHandler(async (req, res) => res.json(portalService.analyticsPerformanceRadar(scopeFrom(req), String(req.query.phaseId)))));
hodRouter.get("/analytics/at-risk", asyncHandler(async (req, res) => res.json(portalService.analyticsAtRisk(scopeFrom(req), req.query))));
hodRouter.post("/analytics/at-risk/notify-mentor", asyncHandler(async (req, res) => res.json(portalService.notifyAtRiskMentor(String(req.body.enrollmentNo)))));
hodRouter.get("/analytics/year-comparison", asyncHandler(async (_req, res) => res.json(portalService.analyticsYearComparison())));
hodRouter.get("/analytics/export", asyncHandler(async (_req, res) => sendPdf(res, "analytics-report.pdf", portalService.analyticsExport())));
hodRouter.get("/promotion/years", asyncHandler(async (_req, res) => res.json(portalService.promotionYears())));
hodRouter.get("/promotion/preview", asyncHandler(async (req, res) => res.json(portalService.promotionPreview(String(req.query.fromAcademicYearId), String(req.query.toAcademicYearId)))));
hodRouter.post("/promotion/mapping/csv", upload.single("file"), asyncHandler(async (_req, res) => res.json(portalService.promotionMappingCsv())));
hodRouter.put("/promotion/mapping", asyncHandler(async (req, res) => res.json(portalService.savePromotionMapping(String(req.body.fromAcademicYearId), String(req.body.toAcademicYearId), req.body.mappings))));
hodRouter.get("/promotion/roll-numbers/suggest", asyncHandler(async (req, res) => res.json(portalService.suggestRollNumbers(String(req.query.draftId)))));
hodRouter.post("/promotion/roll-numbers/csv", upload.single("file"), asyncHandler(async (_req, res) => res.json(portalService.promotionRollCsv())));
hodRouter.get("/promotion/preview-summary", asyncHandler(async (req, res) => res.json(portalService.promotionPreviewSummary(String(req.query.draftId)))));
hodRouter.post("/promotion/execute", asyncHandler(async (req, res) => res.json(portalService.executePromotion(String(req.body.draftId), req.body.mappings))));
hodRouter.get("/promotion/history", asyncHandler(async (req, res) => res.json(portalService.promotionHistory(Number(req.query.page ?? 1), Number(req.query.limit ?? 10)))));
hodRouter.get("/calendar/events", asyncHandler(async (req, res) => res.json(portalService.calendarEvents(req.query))));
hodRouter.get("/calendar/events/upcoming", asyncHandler(async (req, res) => res.json(portalService.upcomingEvents(Number(req.query.limit ?? 6)))));
hodRouter.get("/calendar/events/:eventId", asyncHandler(async (req, res) => res.json(portalService.getEvent(str(req.params.eventId)))));
hodRouter.post("/calendar/events", asyncHandler(async (req, res) => res.status(201).json(portalService.createEvent(req.body))));
hodRouter.put("/calendar/events/:eventId", asyncHandler(async (req, res) => res.json(portalService.updateEvent(str(req.params.eventId), req.body))));
hodRouter.delete("/calendar/events/:eventId", asyncHandler(async (req, res) => {
    portalService.deleteEvent(str(req.params.eventId));
    res.status(204).send();
}));
hodRouter.get("/calendar/phase-timeline", asyncHandler(async (req, res) => res.json(portalService.phaseTimeline(scopeFrom(req), req.query.semesterId))));
hodRouter.get("/calendar/export", asyncHandler(async (_req, res) => sendPdf(res, "calendar.pdf", portalService.calendarExport())));
hodRouter.get("/settings/profile", asyncHandler(async (req, res) => res.json(portalService.settingsProfile(req.user.id))));
hodRouter.put("/settings/profile", asyncHandler(async (req, res) => res.json(portalService.updateSettingsProfile(req.user.id, req.body))));
hodRouter.post("/settings/profile/photo", upload.single("file"), asyncHandler(async (req, res) => res.json(portalService.uploadProfilePhoto(req.user.id))));
hodRouter.get("/settings/university", asyncHandler(async (req, res) => res.json(portalService.universitySettings(req.user.universityId))));
hodRouter.put("/settings/university", asyncHandler(async (req, res) => res.json(portalService.updateUniversity(req.user.universityId, req.body))));
hodRouter.post("/settings/university/branches", asyncHandler(async (req, res) => res.status(201).json(portalService.addUniversityBranch(req.user.universityId, String(req.body.code), String(req.body.name)))));
hodRouter.get("/settings/academic-years", asyncHandler(async (_req, res) => res.json(portalService.academicYears())));
hodRouter.post("/settings/academic-years", asyncHandler(async (req, res) => res.status(201).json(portalService.createAcademicYear(req.body))));
hodRouter.patch("/settings/academic-years/:yearId/activate", asyncHandler(async (req, res) => res.json(portalService.activateAcademicYear(str(req.params.yearId)))));
hodRouter.post("/settings/academic-years/:yearId/semesters", asyncHandler(async (req, res) => res.status(201).json(portalService.createSemester(str(req.params.yearId), req.body))));
hodRouter.get("/settings/notifications", asyncHandler(async (req, res) => res.json(portalService.notifications(req.user.id))));
hodRouter.put("/settings/notifications", asyncHandler(async (req, res) => res.json(portalService.updateNotifications(req.user.id, req.body.preferences))));
hodRouter.patch("/settings/security/password", asyncHandler(async (req, res) => res.json(portalService.changePassword(req.user.id, String(req.body.currentPassword), String(req.body.newPassword)))));
hodRouter.get("/settings/security/sessions", asyncHandler(async (req, res) => res.json(portalService.securitySessions(req.user.id))));
hodRouter.delete("/settings/security/sessions/:sessionId", asyncHandler(async (req, res) => {
    portalService.revokeSession(str(req.params.sessionId));
    res.status(204).send();
}));
hodRouter.get("/settings/attendance-rules", asyncHandler(async (_req, res) => res.json(portalService.attendanceRules())));
hodRouter.put("/settings/attendance-rules", asyncHandler(async (req, res) => res.json(portalService.updateAttendanceRules(req.body))));
hodRouter.post("/settings/danger/reset-mentor-assignments", asyncHandler(async (req, res) => res.json(portalService.resetMentorAssignments(String(req.body.semesterId), Boolean(req.body.confirm)))));
hodRouter.delete("/settings/danger/attendance-records", asyncHandler(async (req, res) => res.json(portalService.deleteAttendanceRecords(String(req.body.semesterId), Boolean(req.body.confirm)))));
hodRouter.post("/settings/danger/archive-year", asyncHandler(async (req, res) => res.status(202).json(portalService.archiveYear(String(req.body.academicYearId)))));
hodRouter.get("/settings/danger/archive-status/:jobId", asyncHandler(async (req, res) => res.json(portalService.archiveStatus(str(req.params.jobId)))));
