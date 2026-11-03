import { getConnInfo } from "@hono/node-server/conninfo";
import {
  APP_SURFACE_API,
  APP_SURFACE_HEADER_NAME,
  parseRequestAppSurface,
  REQUESTING_THREAD_HEADER_NAME,
  type RequestAppSurface,
} from "@bb/config/app-surface";
import type { InteractionResolver } from "@bb/domain";
import type { Context } from "hono";
import { ApiError } from "./errors.js";

export const TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY = "bbTrustedRemoteAddress";
const GATE_AUTH_HEADER_NAME = "x-bb-gate-auth";
const GATE_MACHINE_ID_HEADER_NAME = "x-bb-gate-machine-id";
type GateAuthKind = "machine" | "session";
const REQUESTING_THREAD_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export interface GateAuthHeaderReader {
  req: { header(name: string): string | undefined };
}

interface TrustedRemoteAddressReader {
  get(key: typeof TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY): string | undefined;
}

declare module "hono" {
  interface ContextVariableMap {
    [TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY]: string | undefined;
  }
}

export function captureTrustedRemoteAddress(context: Context): void {
  try {
    context.set(
      TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY,
      getConnInfo(context).remote.address,
    );
  } catch {
    context.set(TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY, undefined);
  }
}

export function getTrustedRemoteAddress(
  context: TrustedRemoteAddressReader,
): string | undefined {
  return context.get(TRUSTED_REMOTE_ADDRESS_CONTEXT_KEY);
}

export function getGateAuthKind(
  context: GateAuthHeaderReader,
): GateAuthKind | null {
  const value = context.req.header(GATE_AUTH_HEADER_NAME);
  return value === "machine" || value === "session" ? value : null;
}

export function getGateMachineId(context: GateAuthHeaderReader): string | null {
  const value = context.req.header(GATE_MACHINE_ID_HEADER_NAME)?.trim();
  return value ? value : null;
}

export function resolveInteractionResolver(
  context: GateAuthHeaderReader,
): InteractionResolver {
  const surface =
    parseRequestAppSurface(context.req.header(APP_SURFACE_HEADER_NAME)) ??
    APP_SURFACE_API;
  const gateAuth = getGateAuthKind(context);
  const requestingThreadId =
    context.req.header(REQUESTING_THREAD_HEADER_NAME)?.trim() || null;
  if (
    requestingThreadId !== null &&
    !REQUESTING_THREAD_ID_PATTERN.test(requestingThreadId)
  ) {
    throw new ApiError(
      400,
      "invalid_request",
      `Invalid ${REQUESTING_THREAD_HEADER_NAME} header`,
    );
  }
  const kind =
    requestingThreadId !== null
      ? "agent"
      : gateAuth !== "machine" && surface !== APP_SURFACE_API
        ? "ui"
        : "api";
  return { kind, surface, gateAuth, requestingThreadId };
}

export function resolveRequestAppSurface(context: Context): RequestAppSurface {
  return (
    parseRequestAppSurface(context.req.header(APP_SURFACE_HEADER_NAME)) ??
    APP_SURFACE_API
  );
}
