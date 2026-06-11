import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

/**
 * Parse and validate a request body against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }

  return { data: result.data, error: null };
}
