import { RequestHandler, Router } from "express";
import { getCitiesController } from "@/modules/common/F5003-cities/controllers/get-cities.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";

const router = Router();

router.get("/", isAuthenticated(), getCitiesController as RequestHandler);

export default router;
