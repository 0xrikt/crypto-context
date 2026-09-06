/** Resolve same-origin return paths after email authentication. */
export function safeReturnPath(value: string | null, origin: string): string {
  if (!value || !value.startsWith('/') || /[\\\u0000-\u0020]/.test(value)) return '/dashboard';
  try {
    const url = new URL(value, origin);
    return url.origin === new URL(origin).origin ? `${url.pathname}${url.search}${url.hash}` : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
