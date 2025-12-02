// Function to encode Unicode string to Base64
export function utf8ToBase64(str: string): string {
  // Encode string to Base64 using TextEncoder and btoa
  const utf8Bytes = new TextEncoder().encode(str);
  return btoa(String.fromCharCode(...utf8Bytes));
}

// Function to validate and sanitize Base64 string
export function sanitizeBase64(base64Str: string): string {
  // Remove any characters not valid in Base64
  const sanitized = base64Str.replace(/[^A-Za-z0-9+/=]/g, "");
  // Ensure proper padding
  const padding = sanitized.length % 4;

  if (padding === 0) return sanitized;
  if (padding === 2) return sanitized + "==";
  if (padding === 3) return sanitized + "=";
  if (padding === 1) {
    throw new Error("Invalid Base64 string: length modulo 4 is 1, indicating incorrect padding or an incomplete Base64 encoding.");
  }

  // This line is unreachable but added for safety
  throw new Error("Invalid Base64 string: improper padding");
}

// Function to decode Base64 to Unicode string
export function base64ToUtf8(base64Str: string): string {
  // Sanitize the Base64 string before decoding
  const sanitizedBase64 = sanitizeBase64(base64Str);
  // Decode Base64 to UTF-8 string using atob and TextDecoder
  const binaryString = atob(sanitizedBase64);
  const utf8Bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(utf8Bytes);
}

// Function to encode an object to Base64
export function objectToBase64(obj: Record<string, any>): string {
  // Convert object to JSON string
  const jsonString = JSON.stringify(obj);
  // Encode JSON string to Base64
  return utf8ToBase64(jsonString);
}

// Function to decode Base64 to an object
export function base64ToObject(base64Str: string): Record<string, any> {
  // Decode Base64 to JSON string
  const jsonString = base64ToUtf8(base64Str);
  // Parse JSON string to object
  return JSON.parse(jsonString);
}

// Function to handle both encoding and decoding
export function handleBase64(action: "encode" | "decode", str: string): string {
  if (action === "encode") {
    return utf8ToBase64(str);
  } else if (action === "decode") {
    return base64ToUtf8(str);
  } else {
    throw new Error("Invalid action. Use 'encode' or 'decode'.");
  }
}
