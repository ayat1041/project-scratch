import { RequestHandler, Router } from "express";
import { getCountriesController } from "@/modules/common/F5001-countries/controllers/get-countries.controller";
import { isAuthenticated } from "@/middleware/authentication.middleware";

const router = Router();

router.get("/", isAuthenticated(), getCountriesController as RequestHandler);

export default router;
