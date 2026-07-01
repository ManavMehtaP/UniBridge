import { Router } from "express";

import { requireAuth, requireUserRole } from "../middleware/auth.js";
import { portalService } from "../services/portal.service.js";
import { asyncHandler } from "../utils/http.js";

export const studentRouter = Router();

studentRouter.use(requireAuth);
studentRouter.use(requireUserRole("STUDENT"));

studentRouter.get("/attendance", asyncHandler(async (req, res) => {
  res.json(portalService.studentAttendance(req.user!.id, req.query.semesterId as string | undefined));
}));
