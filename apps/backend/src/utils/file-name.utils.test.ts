import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeFileName } from "@/utils/file-name.utils";

test("sanitizeFileName keeps an already-safe file name unchanged", () => {
  assert.equal(sanitizeFileName("report.pdf"), "report.pdf");
});

test("sanitizeFileName preserves dots, dashes, and underscores in the stem", () => {
  assert.equal(
    sanitizeFileName("q1-2024_report.final.docx"),
    "q1-2024_report.final.docx",
  );
});

test("sanitizeFileName strips directory components (path traversal)", () => {
  assert.equal(sanitizeFileName("../../etc/passwd"), "passwd");
  assert.equal(sanitizeFileName("../../../secrets.env"), "secrets.env");
});

test("sanitizeFileName strips Windows-style path separators", () => {
  assert.equal(sanitizeFileName("C:\\Users\\evil\\payload.exe"), "payload.exe");
});

test("sanitizeFileName replaces unsafe characters with underscores", () => {
  assert.equal(
    sanitizeFileName("<script>alert(1)</script>.png"),
    "script_.png",
  );
});

test("sanitizeFileName strips null bytes and control characters", () => {
  assert.equal(sanitizeFileName("evil\x00\x1f.pdf"), "evil__.pdf");
});

test("sanitizeFileName strips leading dots so the file can't become hidden", () => {
  assert.equal(sanitizeFileName("...hidden.pdf"), "hidden.pdf");
});

test("sanitizeFileName falls back to 'file' when the stem is empty after sanitizing", () => {
  assert.equal(sanitizeFileName(".pdf"), "pdf");
  assert.equal(sanitizeFileName("///"), "file");
});

test("sanitizeFileName drops unsafe characters from the extension too", () => {
  assert.equal(sanitizeFileName("report.p<d>f"), "report.pdf");
});

test("sanitizeFileName truncates an excessively long stem", () => {
  const longName = `${"a".repeat(300)}.pdf`;
  const result = sanitizeFileName(longName);

  assert.equal(result, `${"a".repeat(150)}.pdf`);
});

test("sanitizeFileName handles file names with no extension", () => {
  assert.equal(sanitizeFileName("README"), "README");
});

test("sanitizeFileName preserves unicode letters mapped to underscores but keeps a usable name", () => {
  const result = sanitizeFileName("résumé café.pdf");
  assert.equal(result, "r_sum__caf_.pdf");
});
