export function cn(
  ...classes: (string | null | undefined | boolean)[]
): string {
  return classes.filter(Boolean).join(" ");
}
