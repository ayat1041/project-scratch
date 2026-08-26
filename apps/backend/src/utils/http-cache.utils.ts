import { createHash } from "crypto";
import { Request, Response } from "express";

const buildWeakEtag = (payload: unknown): string => {
  const json = JSON.stringify(payload);
  const hash = createHash("sha1").update(json).digest("base64url");
  return `W/"${hash}"`;
};

const matchesIfNoneMatch = (ifNoneMatch: string, etag: string): boolean => {
  if (ifNoneMatch.trim() === "*") return true;
  return ifNoneMatch
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === etag);
};

export const sendJsonWithEtag = (
  req: Request,
  res: Response,
  payload: unknown,
  statusCode = 200,
): void => {
  const etag = buildWeakEtag(payload);
  const ifNoneMatch = req.header("if-none-match");

  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "private, must-revalidate");
  res.setHeader("Vary", "Authorization");

  if (ifNoneMatch && matchesIfNoneMatch(ifNoneMatch, etag)) {
    res.status(304).end();
    return;
  }

  res.status(statusCode).json(payload);
};
