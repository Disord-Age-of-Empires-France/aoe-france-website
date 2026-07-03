import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import crypto from "node:crypto";

const ISSUER = "AoE France";

export function generateTOTPSecret(username: string): { secret: string; otpauthUrl: string } {
  const totp = new OTPAuth.TOTP({
    issuer:    ISSUER,
    label:     username,
    algorithm: "SHA1",
    digits:    6,
    period:    30,
    secret:    new OTPAuth.Secret({ size: 20 }),
  });
  return { secret: totp.secret.base32, otpauthUrl: totp.toString() };
}

export function verifyTOTP(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer:    ISSUER,
    algorithm: "SHA1",
    digits:    6,
    period:    30,
    secret:    OTPAuth.Secret.fromBase32(secret),
  });
  return totp.validate({ token, window: 1 }) !== null;
}

export async function generateQRCodeDataURL(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { width: 200, margin: 1 });
}

export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: 8 }, () => {
    const bytes = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `${bytes.slice(0, 4)}-${bytes.slice(4)}`;
  });
  const hashed = plain.map(code =>
    crypto.createHash("sha256").update(code.replace(/-/g, "")).digest("hex")
  );
  return { plain, hashed };
}

export function verifyBackupCode(
  input: string,
  hashedCodes: string[]
): { valid: boolean; remaining: string[] } {
  const normalized = input.replace(/[-\s]/g, "").toUpperCase();
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  const idx = hashedCodes.indexOf(hash);
  if (idx === -1) return { valid: false, remaining: hashedCodes };
  return { valid: true, remaining: hashedCodes.filter((_, i) => i !== idx) };
}

export function generateDeviceToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(32).toString("hex");
  const hash  = crypto.createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

export function hashDeviceToken(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}
