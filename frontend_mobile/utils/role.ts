export function formatRoleLabel(role?: string | null): string {
  if (!role) return '';
  return role.replace(/_/g, ' ').toUpperCase();
}
