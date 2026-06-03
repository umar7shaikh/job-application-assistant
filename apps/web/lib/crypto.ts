import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

/**
 * AES-256-GCM encryption for users' bring-your-own API keys (Apify, AI).
 * Keys are NEVER stored or logged in plaintext — only the encrypted blob
 * lives in the database, and it's only decrypted server-side at call time.
 */

function key(): Buffer {
  const k = Buffer.from(env.secretsKey, "base64");
  if (k.length !== 32) {
    throw new Error("SECRETS_KEY must be 32 bytes encoded as base64.");
  }
  return k;
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext, all base64
  return [iv, tag, enc].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(blob: string): string {
  const [ivB64, tagB64, dataB64] = blob.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
