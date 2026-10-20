// Short vibration on phones that support it; silently does nothing elsewhere.
export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* not supported */
  }
}
