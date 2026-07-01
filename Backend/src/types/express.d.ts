import type { RequestUser, University } from "./domain.js";

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      university?: University;
      hodBatchIds?: string[];
      hodBatchCodes?: string[];
      hodSemesterIds?: string[];
    }
  }
}

export {};
