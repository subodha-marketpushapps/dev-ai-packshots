import { describe, it, expect } from "vitest";
import { sanitizeBase64 } from "./base64-utils";

describe("sanitizeBase64", () => {
  it("should remove invalid characters from Base64 string", () => {
    const input = "dGVzdA$#@!";
    const expected = "dGVzdA==";
    expect(sanitizeBase64(input)).toBe(expected);
  });

  it("should add proper padding when length modulo 4 is 2", () => {
    const input = "dGVzdA";
    const expected = "dGVzdA==";
    expect(sanitizeBase64(input)).toBe(expected);
  });

  it("should add proper padding when length modulo 4 is 3", () => {
    const input = "dGVzdA1";
    const expected = "dGVzdA1=";
    expect(sanitizeBase64(input)).toBe(expected);
  });

  it("should throw an error when length modulo 4 is 1", () => {
    const input = "d";
    expect(() => sanitizeBase64(input)).toThrow(
      "Invalid Base64 string: length modulo 4 is 1, indicating incorrect padding or an incomplete Base64 encoding."
    );
  });

  it("should return the same string if already valid and properly padded", () => {
    const input = "dGVzdA==";
    const expected = "dGVzdA==";
    expect(sanitizeBase64(input)).toBe(expected);
  });

  it("should handle empty strings gracefully", () => {
    const input = "";
    const expected = "";
    expect(sanitizeBase64(input)).toBe(expected);
  });
});