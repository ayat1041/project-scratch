import { basename, extname } from "path";

const MAX_SANITIZED_FILE_NAME_LENGTH = 150;

/**
 * Strips path components and any character outside a safe allowlist so a
 * crafted `originalname` (path traversal, script/HTML payloads, control
 * characters, null bytes) can never influence a storage key or be rendered
 * unescaped downstream as a display file name.
 */
export const sanitizeFileName = (rawFileName: string): string => {
  const baseName = basename(rawFileName.replace(/\\/g, "/"));
  const extension = extname(baseName).slice(0, 20);
  const stem = baseName
    .slice(0, baseName.length - extension.length)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, MAX_SANITIZED_FILE_NAME_LENGTH);

  const safeExtension = extension.replace(/[^a-zA-Z0-9.]/g, "");

  return `${stem || "file"}${safeExtension}`;
};
