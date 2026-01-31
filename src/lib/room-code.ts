// Room code generation utility

const ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding I, O, 0, 1 for clarity

/**
 * Generate a random 6-character alphanumeric room code.
 * Excludes ambiguous characters (I, O, 0, 1).
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALLOWED_CHARS.charAt(
      Math.floor(Math.random() * ALLOWED_CHARS.length)
    );
  }
  return code;
}
