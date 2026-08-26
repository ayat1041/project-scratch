import { z } from "zod";
type JsonSchema = {
    type?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    minItems?: number;
    maxItems?: number;
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
    allOf?: JsonSchema[];
    properties?: Record<string, JsonSchema>;
};

function extractLimit(field: JsonSchema, kind: "min" | "max"): number | undefined {
    if (field.type === "string") {
        return kind === "min" ? field.minLength : field.maxLength;
    }

    if (field.type === "number" || field.type === "integer") {
        return kind === "min" ? field.minimum : field.maximum;
    }

    if (field.type === "array") {
        return kind === "min" ? field.minItems : field.maxItems;
    }

    // Handle anyOf/oneOf/allOf unions - recursively search all options
    if (field.anyOf) {
        for (const option of field.anyOf) {
            const value = extractLimit(option, kind);
            if (value !== undefined) return value;
        }
    }

    // Also check oneOf and allOf
    const oneOf = field.oneOf;
    if (oneOf && Array.isArray(oneOf)) {
        for (const option of oneOf) {
            const value = extractLimit(option, kind);
            if (value !== undefined) return value;
        }
    }

    const allOf = field.allOf;
    if (allOf && Array.isArray(allOf)) {
        for (const option of allOf) {
            const value = extractLimit(option, kind);
            if (value !== undefined) return value;
        }
    }

    return undefined;
}

/**
 * Extracts a field schema from an object schema and unwraps it.
 */
function getFieldSchema(schema: z.ZodType, fieldName: string): z.ZodType | undefined {
    // Zod does not publicly type `_def` — reaching into it is unavoidable here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = schema._def as any;

    // Check if it's a ZodObject (Zod v4 uses def.type === 'object').
    // In Zod 4, object-level .refine() keeps _def.type === 'object', so no unwrapping needed.
    if (def.type !== 'object' || !def.shape) {
        return undefined;
    }

    const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
    const fieldSchema = shape[fieldName];

    if (!fieldSchema) {
        return undefined;
    }

    return unwrapSchema(fieldSchema);
}

/**
 * Unwraps a Zod schema to remove transforms, refinements, and other effects
 * that cannot be represented in JSON Schema
 */
function unwrapSchema(schema: z.ZodType): z.ZodType {
    // Zod does not publicly type `_def` — reaching into it is unavoidable here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = schema._def as any;

    // Handle ZodUnion - unwrap each option and filter out undefined/literal types
    if (def.type === 'union' && def.options && Array.isArray(def.options)) {
        const unwrappedOptions = def.options
            .map((opt: z.ZodType) => unwrapSchema(opt))
            .filter((opt: z.ZodType) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const optDef = (opt as any)._def;
                // Filter out undefined and empty string literals that can't be represented in JSON Schema
                if (optDef.type === 'undefined') return false;
                if (optDef.type === 'literal' && optDef.values?.[0] === '') return false;
                return true;
            });

        // If only one option remains after filtering, return it directly
        if (unwrappedOptions.length === 1) {
            return unwrappedOptions[0];
        }

        // If multiple options remain, create a union
        if (unwrappedOptions.length > 1) {
            // z.union's tuple-length type constraint doesn't accept a dynamically-sized array.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return z.union(unwrappedOptions as any) as any;
        }

        // If no options remain (shouldn't happen), return string as fallback
        return z.string();
    }

    // Handle ZodPipe - unwrap to input schema (before transform)
    if (def.type === 'pipe' && def.in) {
        return unwrapSchema(def.in);
    }

    // Handle effects (transform, refine, preprocess)
    if (def.schema) {
        return unwrapSchema(def.schema);
    }

    // Handle optional, nullable, default
    if (def.innerType) {
        return unwrapSchema(def.innerType);
    }

    return schema;
}

export function getFieldLimit(
    schema: z.ZodType,
    fieldName: string,
    kind: "min" | "max",
    isHtml?: boolean,
): number | undefined {
    try {
        // Extract and unwrap just the specific field
        const fieldSchema = getFieldSchema(schema, fieldName);

        if (!fieldSchema) {
            return undefined;
        }

        // Check for .meta({ htmlMaxChars / htmlMinChars }) set on fields that use
        // .refine() for plain-text HTML length validation instead of .max()/.min().
        // Zod 4 stores .meta() in a global registry, not in _def.
        const meta = z.globalRegistry.get(fieldSchema);
        if (meta) {
            // htmlMaxChars/htmlMinChars are project-specific custom metadata keys,
            // not part of Zod's typed .meta() shape.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const metaLimit = kind === 'max' ? (meta as any).htmlMaxChars : (meta as any).htmlMinChars;
            if (metaLimit !== undefined) return metaLimit;
        }

        // Convert the unwrapped field schema to JSON Schema
        const jsonSchema = (z.toJSONSchema(fieldSchema, {
            target: 'draft-7',
            io: 'input',
        })) as JsonSchema;

        const limit = extractLimit(jsonSchema, kind);

        if (isHtml && limit) {
            return limit - 99999999;
        }
        return limit;
    } catch (error) {
        // If conversion to JSON Schema fails, return undefined
        console.error(`Failed to extract field limit for ${fieldName}:`, error);
        return undefined;
    }
}