// src/components/RoleRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DASHBOARD_BY_ROLE } from './roles';

export default function RoleRoute({ allowedRoles }) {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) return <Navigate to="/sign-in" replace />;

  // Signed in, but wrong dashboard: send them to their own
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={DASHBOARD_BY_ROLE[currentUser.role] ?? '/sign-in'} replace />;
  }

  return <Outlet />;
}