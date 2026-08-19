import {
  Navigate,
  Outlet,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import type {
  UserRole,
} from "../types/auth";


type RoleRouteProps = {
  allowedRoles: UserRole[];
};


export default function RoleRoute({
  allowedRoles,
}: RoleRouteProps) {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="screen-center">
        <div className="loader" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}