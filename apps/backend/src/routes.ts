import { Express } from "express";
import { permissionsRoutes } from "@/modules/user-management/F6001-permissions/index";
import { rolesRoutes } from "@/modules/user-management/F6002-roles/index";
import cronJobsRoutes from "@/modules/platform/F9001-cron-jobs/cron-jobs.routes";
import languageRoutesV1 from "@/modules/common/F5004-languages/language.routes";
import countryRoutesV1 from "@/modules/common/F5001-countries/countries.routes";
import stateRoutesV1 from "@/modules/common/F5002-states/states.routes";
import cityRoutesV1 from "@/modules/common/F5003-cities/cities.routes";
import searchLocationRoutes from "@/modules/common/F5007-search-location/search-location.routes";
// F5008 (activity-logs) is intentionally not mounted yet — see
// packages/constants/src/modules/features/features.ts for why it's "in-progress".

import authRoutesV1 from "@/modules/auth/auth.routes";

export const registerRoutes = (app: Express) => {
  // Authentication routes
  app.use("/api/auth/v1", authRoutesV1);
  // User management routes
  app.use("/api/user-management/v1/permissions", permissionsRoutes);
  app.use("/api/user-management/v1/roles", rolesRoutes);

  // Cron jobs management routes
  app.use("/api/cron-jobs", cronJobsRoutes);

  // languages routes
  app.use("/api/common/v1/languages", languageRoutesV1);

  // countries routes
  app.use("/api/common/v1/countries", countryRoutesV1);

  //states routes
  app.use("/api/common/v1/states", stateRoutesV1);

  // cities routes
  app.use("/api/common/v1/cities", cityRoutesV1);

  // location search routes
  app.use("/api/common/v1/search-location", searchLocationRoutes);
};
