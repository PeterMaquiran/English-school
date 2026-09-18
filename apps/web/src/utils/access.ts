import type { UserRole } from '@/module/auth';

export function isStaff(role: UserRole) {
  return role === 'admin' || role === 'front_desk' || role === 'teacher';
}

export function canManageStudents(role: UserRole) {
  return role === 'admin' || role === 'front_desk';
}

export function canAdjustCefr(role: UserRole) {
  return role === 'admin';
}

export function canManageScoreBands(role: UserRole) {
  return role === 'admin';
}

export function formatRole(role: UserRole) {
  return role.replaceAll('_', ' ');
}
