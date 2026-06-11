/**
 * src/lib/models.ts
 *
 * Centralized model configuration for all LLM nodes.
 * Used by frontend (dropdowns), backend (API routes), and tasks.
 */

export const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  {
    value: "openai/gpt-5.4-nano",
    label: "Ultra Cheap (Max Requests)",
  },
  {
    value: "mistralai/mistral-small-4",
    label: "Stable Backup",
  },
];

/** Default model used when none is specified */
export const DEFAULT_MODEL = MODEL_OPTIONS[0].value; // "openai/gpt-5.4-nano"

/** Get a model label by value */
export function getModelLabel(value: string): string {
  return MODEL_OPTIONS.find((m) => m.value === value)?.label ?? value;
}
