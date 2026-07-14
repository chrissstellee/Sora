const COOKIE_NAME = "sora_session";

export function readPhase2Environment({ requireBothOrganizations = true } = {}) {
  const baseURL = process.env.PHASE2_BASE_URL;
  const orgA = process.env.PHASE2_ORG_A_SESSION_COOKIE;
  const orgB = process.env.PHASE2_ORG_B_SESSION_COOKIE;
  const missing = [
    !baseURL && "PHASE2_BASE_URL",
    !orgA && "PHASE2_ORG_A_SESSION_COOKIE",
    requireBothOrganizations && !orgB && "PHASE2_ORG_B_SESSION_COOKIE",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `NOT EXECUTED: missing required environment variable${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`,
    );
  }

  let parsedURL;
  try {
    parsedURL = new URL(baseURL);
  } catch {
    throw new Error("NOT EXECUTED: PHASE2_BASE_URL must be an absolute HTTP(S) URL");
  }
  if (!/^https?:$/.test(parsedURL.protocol)) {
    throw new Error("NOT EXECUTED: PHASE2_BASE_URL must use HTTP or HTTPS");
  }

  validateCookie(orgA, "PHASE2_ORG_A_SESSION_COOKIE");
  if (requireBothOrganizations) validateCookie(orgB, "PHASE2_ORG_B_SESSION_COOKIE");

  return {
    baseURL: parsedURL.origin,
    orgA,
    orgB,
  };
}

function validateCookie(value, name) {
  if (!value || /[;\r\n]/.test(value)) {
    throw new Error(`NOT EXECUTED: ${name} must contain only the raw ${COOKIE_NAME} cookie value`);
  }
}

export function cookieHeader(rawValue) {
  return `${COOKIE_NAME}=${rawValue}`;
}

export function playwrightCookie(baseURL, rawValue) {
  const url = new URL(baseURL);
  return {
    name: COOKIE_NAME,
    value: rawValue,
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: /** @type {const} */ ("Lax"),
  };
}

export async function apiRequest(baseURL, cookie, path, init = {}) {
  const response = await fetch(new URL(path, baseURL), {
    ...init,
    headers: {
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
      cookie: cookieHeader(cookie),
    },
  });
  if (!response.ok) {
    let code = `HTTP_${response.status}`;
    try {
      const body = await response.json();
      code = body?.error?.code ?? code;
    } catch {}
    throw new Error(`${init.method ?? "GET"} ${path} failed (${code})`);
  }
  return response;
}

export function percentile(samples, percentileValue) {
  if (!samples.length) throw new Error("Cannot calculate a percentile without samples");
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil((percentileValue / 100) * sorted.length) - 1];
}
