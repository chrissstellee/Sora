import { NextResponse } from "next/server";
import { ZodError } from "zod";

const STATUS_BY_CODE: Record<string, number> = {
  AUTH_REQUIRED: 401,
  ASSET_NOT_FOUND: 404,
  CREATE_REQUEST_CONFLICT: 409,
  REGISTRATION_NUMBER_CONFLICT: 409,
  ASSET_VERSION_CONFLICT: 409,
  ASSET_NOT_EDITABLE: 409,
  PROFILE_VERSION_CONFLICT: 409,
  DOCUMENT_VERSION_CONFLICT: 409,
  LIFECYCLE_CONFLICT: 409,
  UPLOAD_INTENT_REPLAYED: 409,
  STORAGE_OBJECT_ALREADY_LINKED: 409,
  DOCUMENT_LIMIT_REACHED: 413,
  DOCUMENT_TOO_LARGE: 413,
  DOCUMENT_TYPE_UNSUPPORTED: 415,
  DOCUMENT_EXTENSION_MISMATCH: 415,
  DOCUMENT_EMPTY: 415,
  DOCUMENT_NOT_FOUND: 404,
  UPLOAD_INTENT_NOT_FOUND: 404,
  UPLOAD_INTENT_EXPIRED: 409,
  ASSET_NOT_READY_FOR_REVIEW: 422,
  INVALID_RETURN_REASON: 422,
  INVALID_CANONICAL_SUPPLY: 422,
  ISSUANCE_NOT_FOUND: 404,
  ASSET_NOT_READY_FOR_ISSUANCE: 409,
  MANAGED_ASSET_IDENTITY_CONFLICT: 409,
  ISSUANCE_NOT_SAFE_TO_RESUME: 409,
  APPROVED_MANIFEST_MISSING: 409,
  ISSUANCE_PUBLIC_ACCOUNTS_INVALID: 503,
  INVALID_CREATE_REQUEST_ID: 422,
  INVALID_CURSOR: 422,
  INVALID_LIMIT: 422,
  INVALID_PAGE_LIMIT: 422,
  INVALID_ACCOUNT_SEARCH: 422,
  INVALID_OWNERSHIP_CURSOR: 422,
  HORIZON_RATE_LIMITED: 429,
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

export function normalizePaginationError(error: unknown, cursor: string | null): unknown {
  if (
    cursor !== null &&
    error instanceof Error &&
    /\b(?:pagination\s+)?cursor\b/i.test(error.message)
  ) {
    return new Error("INVALID_CURSOR");
  }
  return error;
}

function errorMessage(code: string): string {
  if (code === "AUTH_REQUIRED") return "Authentication is required.";
  if (code === "ASSET_NOT_FOUND") return "Asset not found.";
  if (code === "ASSET_VERSION_CONFLICT") return "The asset changed since it was loaded.";
  if (code === "ASSET_NOT_EDITABLE") return "Only Draft assets can be edited.";
  if (code === "PROFILE_VERSION_CONFLICT")
    return "The tokenization profile changed since it was loaded.";
  if (code === "DOCUMENT_VERSION_CONFLICT") return "The document changed since it was loaded.";
  if (code === "LIFECYCLE_CONFLICT") return "The asset is not in a state that permits this action.";
  if (code === "DOCUMENT_LIMIT_REACHED") return "An asset can have at most 10 active documents.";
  if (code === "DOCUMENT_TOO_LARGE") return "Documents must be 10 MB or smaller.";
  if (["DOCUMENT_TYPE_UNSUPPORTED", "DOCUMENT_EXTENSION_MISMATCH", "DOCUMENT_EMPTY"].includes(code))
    return "The stored file is empty, unsupported, or does not match its extension.";
  if (code === "DOCUMENT_NOT_FOUND" || code === "UPLOAD_INTENT_NOT_FOUND")
    return "Document not found.";
  if (code === "UPLOAD_INTENT_EXPIRED" || code === "UPLOAD_INTENT_REPLAYED")
    return "The upload authorization expired or was already used.";
  if (code === "ASSET_NOT_READY_FOR_REVIEW")
    return "Complete the tokenization profile and add a validated document first.";
  if (code === "INVALID_RETURN_REASON")
    return "Provide a return reason between 10 and 500 characters.";
  if (code === "INVALID_CANONICAL_SUPPLY")
    return "Supply must be positive, use at most seven decimals, and fit Stellar limits.";
  if (code === "ISSUANCE_NOT_FOUND") return "Issuance not found.";
  if (code === "ASSET_NOT_READY_FOR_ISSUANCE") return "Only a Ready asset can start issuance.";
  if (code === "MANAGED_ASSET_IDENTITY_CONFLICT")
    return "That Testnet asset identity is already reserved.";
  if (code === "ISSUANCE_NOT_SAFE_TO_RESUME")
    return "Issuance cannot be resumed until reconciliation proves it is safe.";
  if (code === "APPROVED_MANIFEST_MISSING")
    return "The approved immutable review basis is unavailable.";
  if (code === "REGISTRATION_NUMBER_CONFLICT") return "Registration number is already in use.";
  if (code === "CREATE_REQUEST_CONFLICT")
    return "Create request was already used with different data.";
  if (code === "INVALID_CREATE_REQUEST_ID") return "Create request ID must be a UUID.";
  if (code === "INVALID_CURSOR") return "Pagination cursor is invalid or expired.";
  if (code === "INVALID_LIMIT") return "Limit must be an integer between 1 and 100.";
  if (code === "INVALID_PAGE_LIMIT") return "Limit must be an integer between 1 and 100.";
  if (code === "INVALID_ACCOUNT_SEARCH") return "Enter a valid Stellar account prefix.";
  if (code === "INVALID_OWNERSHIP_CURSOR")
    return "Ownership pagination cursor is invalid or expired.";
  if (code === "HORIZON_RATE_LIMITED")
    return "Ownership synchronization is rate limited. Wait briefly, then retry.";
  return "The service is temporarily unavailable.";
}
