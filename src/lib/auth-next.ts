/**
 * Solo permite retornos relativos internos. Los enlaces de los correos llevan
 * un token en la query y deben sobrevivir al login sin abrir un redirect
 * externo (open redirect).
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  // Los navegadores normalizan saltos de línea y otros caracteres de control.
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return null;
  }
  return value;
}
