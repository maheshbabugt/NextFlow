/**
 * src/lib/execution/index.ts
 *
 * Re-exports the local browser execution engine.
 * All workflow execution (both "Run Node" and "Run Workflow") runs
 * entirely in the browser using Canvas/fetch — no Trigger.dev involved.
 *
 * Trigger.dev tasks (cropTask, extractTask, llmTask, orchestratorTask)
 * are kept for potential server-side use but are NOT called from the UI.
 */

export { runWorkflow } from "./engine";
export type { ExecutionCallbacks } from "./types";
