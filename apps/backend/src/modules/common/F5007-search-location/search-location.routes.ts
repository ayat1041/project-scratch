import { RequestHandler, Router } from "express";
import { isAuthenticated } from "@/middleware/authentication.middleware";
import {
    searchCitiesController,
    searchStatesController,
} from "./controllers/search-location.controller";

const router = Router();

router.get(
    "/states",
    isAuthenticated(),
    searchStatesController as RequestHandler,
);

router.get(
    "/cities",
    isAuthenticated(),
    searchCitiesController as RequestHandler,
);

export default router;