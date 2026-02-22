// utils/jwt.ts

export const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1]; // JWT format: header.payload.signature
    const decodedPayload = atob(payload); // base64 decode
    return JSON.parse(decodedPayload); // convert string to object
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};
