import { z } from "zod";
import { HodService } from "../services/hod.service.js";
const listStudentsQuerySchema = z.object({
    search: z.string().optional(),
    yearLevel: z.enum(["FY", "SY", "TY", "FINAL"]).optional(),
    batchId: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});
const hodService = new HodService();
export class HodController {
    getMyScope(req, res) {
        const result = hodService.getMyScope(req.user.id, req.user.universityId, req.hodBatchIds ?? [], req.hodSemesterIds ?? []);
        return res.status(200).json(result);
    }
    getDashboardSummary(req, res) {
        const result = hodService.getDashboardSummary(req.hodBatchIds ?? [], req.hodSemesterIds ?? []);
        return res.status(200).json(result);
    }
    getStudents(req, res) {
        const query = listStudentsQuerySchema.parse(req.query);
        const result = hodService.getStudents({
            universityId: req.user.universityId,
            hodBatchIds: req.hodBatchIds ?? [],
            search: query.search,
            yearLevel: query.yearLevel,
            batchId: query.batchId,
            page: query.page,
            limit: query.limit,
        });
        return res.status(200).json(result);
    }
}
