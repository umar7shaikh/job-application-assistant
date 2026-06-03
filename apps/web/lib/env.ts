import "server-only";

/** Server-side environment access with fail-fast validation. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const env = {
  /** HMAC key for signing session JWTs. */
  sessionSecret: required("SESSION_SECRET"),
  /** 32-byte base64 key for AES-256-GCM encryption of user API keys. */
  secretsKey: required("SECRETS_KEY"),
};
