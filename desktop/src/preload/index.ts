import { contextBridge, ipcRenderer } from 'electron';

import {
  HUB_TRUST_CHANNEL,
  PEAR_MESSAGE_CHANNEL,
  PEAR_SEND_CHANNEL,
  type HubTrustOutcome,
} from '../shared/ipc';

/**
 * Sub-frames are remote content — the hub lobby UI and the WalletConnect Verify
 * attestation frame — and must not see anything exposed here.
 *
 * `process.isMainFrame` is not part of the `process` subset a sandboxed preload
 * gets, and `webFrame.parent` reports null for out-of-process frames, so
 * identity against `window.top` is the check that actually holds.
 */
if (window === window.top) {
  // front-end/src/util/distribution.ts reads this to drop web-only
  // affordances. It has to be set before the first render, which is why it is
  // a preload global rather than anything asynchronous.
  contextBridge.exposeInMainWorld('__chiaDistribution', 'electron');

  // The whole renderer-to-main surface: ask the user to allow a hub origin.
  // Nothing here decides anything — main validates the origin, prompts, and
  // owns the allowlist.
  contextBridge.exposeInMainWorld('__chiaHub', {
    requestTrust: (origin: string): Promise<HubTrustOutcome> =>
      ipcRenderer.invoke(HUB_TRUST_CHANNEL, origin) as Promise<HubTrustOutcome>,
  });

  // SPIKE: dev-only simulator (see networkPolicy.ts devSimulatorOrigins).
  const devSimulatorUrl = process.env.CHIA_GAMING_DEV_SIMULATOR_URL;
  if (devSimulatorUrl) {
    const ws = new URL(devSimulatorUrl);
    ws.protocol = ws.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.pathname = '/ws';
    contextBridge.exposeInMainWorld('__SIM_URL__', devSimulatorUrl);
    contextBridge.exposeInMainWorld('__SIM_WS_URL__', ws.toString());
    contextBridge.exposeInMainWorld('__chiaDevSimulator', true);
  }

  // The Pear lobby worker: JSON strings in both directions, brokered by main.
  contextBridge.exposeInMainWorld('__chiaPear', {
    send: (message: string): Promise<boolean> =>
      ipcRenderer.invoke(PEAR_SEND_CHANNEL, message) as Promise<boolean>,
    onMessage: (listener: (message: string) => void): (() => void) => {
      const wrapped = (_event: unknown, message: string): void => listener(message);
      ipcRenderer.on(PEAR_MESSAGE_CHANNEL, wrapped);
      return () => {
        ipcRenderer.removeListener(PEAR_MESSAGE_CHANNEL, wrapped);
      };
    },
  });
}
