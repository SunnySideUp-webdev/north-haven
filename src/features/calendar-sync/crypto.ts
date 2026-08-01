import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { getGoogleCalendarEnvironment } from "@/shared/validation/environment";

function getEncryptionKey() {
  const environment = getGoogleCalendarEnvironment();
  if (!environment) throw new Error("Google Calendar is not configured.");

  const key = Buffer.from(
    environment.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY,
    "base64",
  );
  if (key.length !== 32) {
    throw new Error("Google Calendar token encryption is not configured.");
  }
  return key;
}

export function encryptCalendarToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return ["v1", iv, tag, encrypted]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(".");
}

export function decryptCalendarToken(value: string) {
  const [version, ivValue, tagValue, encryptedValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !encryptedValue) {
    throw new Error("Calendar token could not be read.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
