// /src/utils/parseRequestedFields.ts

export default function parseRequestedFields(fields?: string | null): string[] {
  if (!fields) return [];
  return fields
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}
