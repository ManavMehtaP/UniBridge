import { Router } from "express";

import { requireAuth, requireUserRole } from "../middleware/auth.js";
import { portalService } from "../services/portal.service.js";
import { asyncHandler } from "../utils/http.js";

export const facultyRouter = Router();

facultyRouter.use(requireAuth);
facultyRouter.use(requireUserRole("FACULTY"));

facultyRouter.post("/attendance", asyncHandler(async (req, res) => {
  res.status(201).json(portalService.facultyAttendance(req.body, req.user!.id));
}));
