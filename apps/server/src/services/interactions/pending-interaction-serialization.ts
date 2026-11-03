import {
  interactionResolverSchema,
  pendingInteractionSchema,
  type InteractionResolver,
  type PendingInteraction,
} from "@bb/domain";
import type { PendingInteractionRow } from "@bb/db";
import { ApiError } from "../../errors.js";

export class PendingInteractionSerializationError extends ApiError {
  readonly interactionId: string;
  readonly field: "payload" | "resolution" | "resolvedBy";

  constructor(
    interactionId: string,
    field: "payload" | "resolution" | "resolvedBy",
  ) {
    super(
      500,
      "internal_error",
      `Stored pending interaction ${field} is invalid`,
    );
    this.interactionId = interactionId;
    this.field = field;
  }
}

function parseStoredPendingInteractionJson(
  row: PendingInteractionRow,
  field: "payload" | "resolution",
): unknown {
  const value = field === "payload" ? row.payload : row.resolution;
  if (value === null) {
    throw new PendingInteractionSerializationError(row.id, field);
  }
  try {
    return JSON.parse(value);
  } catch {
    throw new PendingInteractionSerializationError(row.id, field);
  }
}

function parseStoredResolver(
  row: PendingInteractionRow,
): InteractionResolver | null {
  if (row.resolvedBy === null) return null;
  try {
    return interactionResolverSchema.parse(JSON.parse(row.resolvedBy));
  } catch {
    throw new PendingInteractionSerializationError(row.id, "resolvedBy");
  }
}

export function toPendingInteraction(
  row: PendingInteractionRow,
): PendingInteraction {
  const payload = parseStoredPendingInteractionJson(row, "payload");
  const resolution =
    row.resolution === null
      ? null
      : parseStoredPendingInteractionJson(row, "resolution");
  const resolvedBy = parseStoredResolver(row);

  try {
    return pendingInteractionSchema.parse({
      id: row.id,
      threadId: row.threadId,
      turnId: row.turnId,
      ...(row.originKind === "provider"
        ? {
            providerId: row.providerId,
            providerThreadId: row.providerThreadId,
            providerRequestId: row.providerRequestId,
          }
        : {}),
      origin:
        row.originKind === "provider"
          ? {
              kind: "provider",
              providerId: row.providerId,
              providerThreadId: row.providerThreadId,
              providerRequestId: row.providerRequestId,
            }
          : {
              kind: "plugin",
              pluginId: row.pluginId,
              rendererId: row.rendererId,
            },
      status: row.status,
      payload,
      resolution,
      statusReason: row.statusReason,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      resolvedAt: row.resolvedAt,
      resolvedBy,
    });
  } catch {
    throw new PendingInteractionSerializationError(row.id, "payload");
  }
}
