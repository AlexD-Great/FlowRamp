// Mock cryptographic functions for development
// In production, replace with a secure backend signing service

export async function sign(message: string): Promise<string> {
  // This is a mock implementation. In a real application, the backend
  // would use a secure private key to generate a verifiable signature.
  return `mock-sig-for-${message}`
}
