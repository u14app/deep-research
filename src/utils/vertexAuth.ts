export interface GoogleCredentials {
  /**
   * The client email for the Google Cloud service account. Defaults to the
   * value of the `GOOGLE_CLIENT_EMAIL` environment variable.
   */
  clientEmail: string;

  /**
   * The private key for the Google Cloud service account. Defaults to the
   * value of the `GOOGLE_PRIVATE_KEY` environment variable.
   */
  privateKey: string;

  /**
   * Optional. The private key ID for the Google Cloud service account. Defaults
   * to the value of the `GOOGLE_PRIVATE_KEY_ID` environment variable.
   */
  privateKeyId?: string;
}

// Convert a string to base64url
const base64url = (str: string) => {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

const decodeBase64 = (base64: string) => {
  return Buffer.from(base64, "base64").toString("utf-8");
};
const importPrivateKey = async (pemKey: string) => {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";

  // Remove header, footer, and any whitespace/newlines
  const pemContents = pemKey.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");

  // Decode base64 to binary
  const binaryString = decodeBase64(pemContents);

  // Convert binary string to Uint8Array
  const binaryData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryData[i] = binaryString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );
};

const buildJwt = async (credentials: GoogleCredentials) => {
  const now = Math.floor(Date.now() / 1000);

  // Only include kid in header if privateKeyId is provided
  const header: { alg: string; typ: string; kid?: string } = {
    alg: "RS256",
    typ: "JWT",
  };

  if (credentials.privateKeyId) {
    header.kid = credentials.privateKeyId;
  }

  const payload = {
    iss: credentials.clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const privateKey = await importPrivateKey(credentials.privateKey);

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signingInput);

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, data);

  const signatureBase64 = base64url(String.fromCharCode(...new Uint8Array(signature)));

  return `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload)
  )}.${signatureBase64}`;
};

/**
 * Generate an authentication token for Google Vertex AI in a manner compatible
 * with the Edge runtime.
 */
export async function generateAuthToken(credentials: GoogleCredentials) {
  const creds = credentials;
  const jwt = await buildJwt(creds);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}
