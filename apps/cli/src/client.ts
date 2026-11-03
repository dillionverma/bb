import { REQUESTING_THREAD_HEADER_NAME } from "@bb/config/app-surface";
import { createNodeBbSdk, type BbSdk } from "@bb/sdk/node";
import type { Dispatcher } from "undici";
import { resolveContextThreadId } from "./context-env.js";

type CliRequestInit = RequestInit & { dispatcher?: Dispatcher };

export function cliFetch(
  input: RequestInfo | URL,
  init?: CliRequestInit,
): Promise<Response> {
  const threadId = resolveContextThreadId();
  if (threadId === undefined) return fetch(input, init);
  const headers = new Headers(init?.headers);
  headers.set(REQUESTING_THREAD_HEADER_NAME, threadId);
  return fetch(input, { ...init, headers });
}

export function createCliBbSdk(baseUrl: string): BbSdk {
  return createNodeBbSdk({ baseUrl, fetch: cliFetch });
}
