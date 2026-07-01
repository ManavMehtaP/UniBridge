import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";
import type { HodBatchScope } from "../types/domain.js";
import { ApiError } from "../utils/http.js";

export class AdminService {
  assignHodScope(facultyId: string, batchIds: string[], semesterId: string) {
    const faculty = store.faculties.find((item) => item.id === facultyId && item.isHod);
    if (!faculty) {
      throw new ApiError(404, "HOD_NOT_FOUND", "HOD faculty record not found.");
    }

    const semester = store.semesters.find((item) => item.id === semesterId);
    if (!semester) {
      throw new ApiError(404, "SEMESTER_NOT_FOUND", "Semester not found.");
    }

    const assigned: Array<{ hodId: string; batchCode: string }> = [];

    batchIds.forEach((batchId) => {
      const batch = store.batches.find((item) => item.id === batchId);
      if (!batch) {
        throw new ApiError(404, "BATCH_NOT_FOUND", `Batch ${batchId} not found.`);
      }

      const existingScope = store.hodBatchScopes.find(
        (item) => item.batchId === batchId && item.semesterId === semesterId && item.facultyId !== facultyId,
      );
      if (existingScope) {
        throw new ApiError(
          409,
          "BATCH_ALREADY_HAS_HOD",
          `Batch ${batch.code} is already assigned to another HOD for this semester.`,
        );
      }

      const currentScope = store.hodBatchScopes.find(
        (item) => item.batchId === batchId && item.semesterId === semesterId && item.facultyId === facultyId,
      );

      const scope: HodBatchScope =
        currentScope ??
        ({
          id: randomUUID(),
          facultyId,
          batchId,
          semesterId,
          createdAt: new Date().toISOString(),
        } satisfies HodBatchScope);

      if (!currentScope) {
        store.hodBatchScopes.push(scope);
      }

      assigned.push({ hodId: facultyId, batchCode: batch.code });
    });

    return { assigned };
  }
}
