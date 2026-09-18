'use client';

import { createContext, useContext } from 'react';
import type { AuthUser } from '@/module/auth';

export const DashboardUserContext = createContext<AuthUser | null>(null);

export function useDashboardUser() {
  const user = useContext(DashboardUserContext);
  if (!user) {
    throw new Error('useDashboardUser must be used inside the dashboard');
  }
  return user;
}
