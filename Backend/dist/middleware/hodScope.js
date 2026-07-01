import { store } from "../data/store.js";
import { ApiError } from "../utils/http.js";
export function hodScope(req, _res, next) {
    if (!req.user?.isHod) {
        return next(new ApiError(403, "FORBIDDEN", "HOD role required."));
    }
    const semesterId = typeof req.query.semesterId === "string" ? req.query.semesterId : undefined;
    const activeSemesterId = semesterId ??
        store.semesters.find((item) => item.universityId === req.user?.universityId && item.isActive)?.id;
    const scopes = store.hodBatchScopes.filter((scope) => scope.facultyId === req.user?.id && (!activeSemesterId || scope.semesterId === activeSemesterId));
    req.hodBatchIds = scopes.map((scope) => scope.batchId);
    req.hodSemesterIds = [...new Set(scopes.map((scope) => scope.semesterId))];
    req.hodBatchCodes = scopes
        .map((scope) => store.batches.find((batch) => batch.id === scope.batchId)?.code)
        .filter((code) => Boolean(code));
    next();
}
