import { ApiError } from "../utils/http.js";
import { store } from "../data/store.js";
export function requireAuth(req, _res, next) {
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
        return next(new ApiError(401, "AUTH_REQUIRED", "Authorization token is required."));
    }
    const [role, userId] = token.split(":");
    if (!role || !userId || !req.university) {
        return next(new ApiError(401, "AUTH_INVALID", "Invalid authorization token format."));
    }
    if (role === "HOD") {
        req.user = {
            id: userId,
            role: "FACULTY",
            isHod: true,
            universityId: req.university.id,
        };
        return next();
    }
    if (role === "FACULTY") {
        req.user = {
            id: userId,
            role: "FACULTY",
            isHod: false,
            universityId: req.university.id,
        };
        return next();
    }
    if (role === "STUDENT") {
        const student = store.students.find((item) => item.id === userId);
        if (!student) {
            return next(new ApiError(401, "AUTH_INVALID", "Invalid student token."));
        }
        req.user = {
            id: userId,
            role: "STUDENT",
            isHod: false,
            universityId: req.university.id,
        };
        return next();
    }
    if (role === "SUPER_ADMIN") {
        req.user = {
            id: userId,
            role: "SUPER_ADMIN",
            isHod: false,
            universityId: req.university.id,
        };
        return next();
    }
    return next(new ApiError(401, "AUTH_INVALID", "Unsupported authorization token role."));
}
export function requireSuperAdmin(req, _res, next) {
    if (req.user?.role !== "SUPER_ADMIN") {
        return next(new ApiError(403, "FORBIDDEN", "Super-admin role required."));
    }
    next();
}
export function requireUserRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, "FORBIDDEN", "Insufficient role for this endpoint."));
        }
        next();
    };
}
