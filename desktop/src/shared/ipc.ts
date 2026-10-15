/**
 * The single IPC channel this app has. Shared by the main process and the
 * preload so the name cannot drift between them.
 */
export const HUB_TRUST_CHANNEL = 'chia-gaming:request-hub-trust';

/**
 * - `trusted`  already on the allowlist; connect straight away.
 * - `granted`  just added to it; the renderer must reload to pick up the widened
 *              CSP before the hub becomes reachable.
 * - `invalid`  malformed origin, or a request from somewhere that may not ask.
 * - `persist-failed` valid origin that could not be saved for the required reload.
 */
export type HubTrustOutcome = 'trusted' | 'granted' | 'invalid' | 'persist-failed';

/**
 * Renderer-to-worker: one JSON command for the Pear lobby worker
 * (`workers/main.cjs`). Main forwards the string and decides nothing.
 */
export const PEAR_SEND_CHANNEL = 'chia-gaming:pear-send';

/** Worker-to-renderer: one JSON message from the Pear lobby worker. */
export const PEAR_MESSAGE_CHANNEL = 'chia-gaming:pear-message';
