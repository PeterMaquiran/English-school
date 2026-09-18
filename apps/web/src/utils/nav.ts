import type { UserRole } from '@/module/auth';

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export function dashboardNav(role: UserRole): NavItem[] {
  const staff: NavItem[] = [
    { href: '/dashboard', label: 'Today', exact: true },
    { href: '/dashboard/students', label: 'Students' },
    { href: '/dashboard/placement', label: 'Placement' },
    { href: '/dashboard/classes', label: 'Group classes' },
    { href: '/dashboard/private', label: 'Private lessons' },
    { href: '/dashboard/teachers', label: 'Teachers' },
    { href: '/dashboard/calendar', label: 'Calendar' },
    { href: '/dashboard/billing', label: 'Billing' },
    { href: '/dashboard/certificates', label: 'Certificates' },
  ];

  if (role === 'teacher') {
    return [
      { href: '/dashboard', label: 'Today', exact: true },
      { href: '/dashboard/students', label: 'Students' },
      { href: '/dashboard/calendar', label: 'Calendar' },
      { href: '/dashboard/certificates', label: 'Certificates' },
    ];
  }

  if (role === 'admin' || role === 'front_desk') {
    return role === 'admin'
      ? [...staff, { href: '/dashboard/settings', label: 'Settings' }]
      : staff;
  }

  return [{ href: '/dashboard', label: 'Today', exact: true }];
}
