import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { asyncHandler } from "../utils/http.js";
const adminController = new AdminController();
export const adminRouter = Router();
adminRouter.post("/hod-scope", asyncHandler(adminController.assignHodScope.bind(adminController)));
