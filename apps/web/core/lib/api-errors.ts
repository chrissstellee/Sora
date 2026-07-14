import { NextResponse } from "next/server";
import { ZodError } from "zod";

const STATUS_BY_CODE: Record<string, number> = {
  AUTH_REQUIRED: 401,
  ASSET_NOT_FOUND: 404,
  CREATE_REQUEST_CONFLICT: 409,
  REGISTRATION_NUMBER_CONFLICT: 409,
  ASSET_VERSION_CONFLICT: 409,
  ASSET_NOT_EDITABLE: 409,
  INVALID_CREATE_REQUEST_ID: 422,
  INVALID_CURSOR: 422,
  INVALID_LIMIT: 422,
};

export function apiError(error: unknown, correlationId: string) {
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request contains invalid fields.",
          correlationId,
          ...(error instanceof ZodError ? { fieldErrors: error.flatten().fieldErrors } : {}),
        },
      },
      { status: 422 },
    );
  }
  const rawMessage = error instanceof Error ? error.message : "SERVICE_UNAVAILABLE";
  const code = Object.keys(STATUS_BY_CODE).find((candidate) => rawMessage.includes(candidate));
  const resolvedCode =
    code ?? (rawMessage.includes("Unauthorized") ? "AUTH_REQUIRED" : "SERVICE_UNAVAILABLE");
  const status = STATUS_BY_CODE[resolvedCode] ?? 503;
  return NextResponse.json(
    { error: { code: resolvedCode, message: errorMessage(resolvedCode), correlationId } },
    { status },
  );
}

function errorMessage(code: string): string {
  if (code === "AUTH_REQUIRED") return "Authentication is required.";
  if (code === "ASSET_NOT_FOUND") return "Asset not found.";
  if (code === "ASSET_VERSION_CONFLICT") return "The asset changed since it was loaded.";
  if (code === "ASSET_NOT_EDITABLE") return "Only Draft assets can be edited.";
  if (code === "REGISTRATION_NUMBER_CONFLICT") return "Registration number is already in use.";
  if (code === "CREATE_REQUEST_CONFLICT")
    return "Create request was already used with different data.";
  if (code === "INVALID_CREATE_REQUEST_ID") return "Create request ID must be a UUID.";
  if (code === "INVALID_CURSOR") return "Pagination cursor is invalid or expired.";
  if (code === "INVALID_LIMIT") return "Limit must be an integer between 1 and 100.";
  return "The service is temporarily unavailable.";
}
