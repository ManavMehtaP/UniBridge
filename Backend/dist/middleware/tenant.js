import { env } from "../config/env.js";
import { store } from "../data/store.js";
import { ApiError } from "../utils/http.js";
export function tenantMiddleware(req, _res, next) {
    const host = req.header("host");
    const hostname = host?.split(":")[0]?.toLowerCase();
    const subdomain = hostname?.includes(".") ? hostname.split(".")[0] : undefined;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
    const slug = !subdomain || isLocalHost ? env.DEFAULT_UNIVERSITY_SLUG : subdomain;
    const university = store.universities.find((item) => item.slug === slug);
    if (!university) {
        return next(new ApiError(404, "UNIVERSITY_NOT_FOUND", "University tenant not found."));
    }
    req.university = university;
    next();
}
