import { SESSION_TOKEN_NAME } from "@/constants/variables";
import { Request, Response } from "express";
import { destroySession } from "@/lib/session-auth.utils";
import { asyncHandler } from "@/utils/async-handler";
import type { SignoutResponse } from "@repo/schemas-types/payload-schemas/auth/Response.type";

export const signoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const sessionToken = req.cookies[SESSION_TOKEN_NAME];

    // Check if user has any authentication
    if (!sessionToken) {
      return res
        .status(400)
        .json({ success: false, message: "Already logged out" });
    }

    // Check query param for logging out all devices
    const allDevices = req.query.allDevices === "true";

    // Use the new destroySession function which handles:
    // 1. Revoking session in database (single device or all devices)
    // 2. Clearing session cookie
    // 3. Clearing CSRF cookie
    await destroySession(req, res, { allDevices });

    const baseResponse: SignoutResponse = {
      success: true,
      message: allDevices
        ? "signed out from all devices successfully"
        : "signed out successfully",
      _links: {
        redirectUrl: "/",
      },
    };

    res.status(200).json(baseResponse);
  },
);
