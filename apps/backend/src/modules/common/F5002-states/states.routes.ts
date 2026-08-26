import { RequestHandler, Router } from "express";
import { getStatesController } from "@/modules/common/F5002-states/controllers/get-states.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";

const router = Router();

router.get("/", isAuthenticated(), getStatesController as RequestHandler);

export default router;
