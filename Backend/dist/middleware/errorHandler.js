import { ZodError } from "zod";
import { ApiError } from "../utils/http.js";
export function notFoundHandler(_req, _res, next) {
    next(new ApiError(404, "NOT_FOUND", "Route not found."));
}
export function errorHandler(error, _req, res, _next) {
    if (error instanceof ZodError) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    issue: issue.message,
                })),
            },
        });
    }
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            error: {
                code: error.code,
                message: error.message,
                details: error.details ?? [],
            },
        });
    }
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message,
            details: [],
        },
    });
}
