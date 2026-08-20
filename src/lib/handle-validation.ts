/**
 * Platform handles differ by provider. Preserve valid punctuation such as a
 * Codeforces dot and let the provider-specific API be the authority.
 */
export function isPlatformHandleFormatValid(handle: string): boolean {
  return handle.trim() === handle && handle.length >= 1 && handle.length <= 64 && !/[\s\u0000-\u001F]/.test(handle);
}
