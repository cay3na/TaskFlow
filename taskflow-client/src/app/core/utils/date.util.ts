
export function asUtc(value: string | null | undefined): string {
  if (!value) return '';
  return /(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : value + 'Z';
}