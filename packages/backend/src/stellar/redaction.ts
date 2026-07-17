const SENSITIVE_KEY = /(?:secret|seed|private|authorization|api[_-]?key|environment)/i;
const SECRET_VALUE_PATTERNS = [
  /S[A-Z2-7]{55}/g,
  /sk_(?:live|test)_[A-Za-z0-9_-]+/g,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  /Bearer\s+[A-Za-z0-9._~-]+/gi,
];

export function redactText(value: string): string {
  return SECRET_VALUE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    value,
  );
}

export function sanitizeForEvidence(value: unknown): unknown {
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map(sanitizeForEvidence);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeForEvidence(entry);
    }
    return output;
  }
  return value;
}

export function sanitizedError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) return { name: error.name, message: redactText(error.message) };
  return { name: "Error", message: redactText(String(error)) };
}
