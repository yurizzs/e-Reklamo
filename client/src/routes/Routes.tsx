import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "./path";
import { ProtectedRoute, OperatorRoute, RoleRoute } from "./guards";
import RootLayout from "./RootLayout";

// Lazy Loading
const Login = React.lazy(() => import("../pages/auth/Login"));
const RoleDashboard = React.lazy(() => import("../pages/RoleDashboard"));
const Users = React.lazy(() => import("../pages/user/User"));
const ViewUserDetail = React.lazy(() => import("../pages/user/components/ViewUserModal"));
const ActivityLogs = React.lazy(() => import("../pages/logs/ActivityLogs"));
const ViolationCategories = React.lazy(() => import("../pages/violation-categories/ViolationCategories"));
const StaffSchedules = React.lazy(() => import("../pages/schedules/StaffSchedulePage"));
const ComplaintsList = React.lazy(() => import("../pages/staff/ComplaintsList"));

export const Routes = createBrowserRouter([
  {
    // Root layout — provides AuthProvider to all child routes
    element: <RootLayout />,
    children: [

      // Operator Only (redirects to dashboard if already logged in)
      {
        element: <OperatorRoute />,
        children: [
          {
            path: PATHS.HOME,
            element: <Navigate to={PATHS.LOGIN} replace />,
          },
          {
            path: PATHS.LOGIN,
            element: <Login />,
          },
        ],
      },

      // Authenticated (redirects to login if not logged in)
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: PATHS.APP.ROOT,
            children: [
              {
                index: true,
                element: <Navigate to={PATHS.APP.DASHBOARD} replace />,
              },
              {
                path: PATHS.APP.DASHBOARD,
                element: <RoleDashboard />,
              },
              {
                element: <RoleRoute allowedRoles={['operator', 'staff']} />,
                children: [
                  {
                    path: PATHS.APP.COMPLAINTS,
                    element: <ComplaintsList />,
                  },
                ],
              },

              // Admin Only
              {
                element: <RoleRoute allowedRoles={['admin']} />,
                children: [
                  {
                    path: PATHS.APP.USERS,
                    element: <Users />,
                  },
                  {
                    path: PATHS.APP.USER_DETAIL,
                    element: <ViewUserDetail />,
                  },
                  {
                    path: PATHS.APP.LOGS,
                    element: <ActivityLogs />,
                  },
                  {
                    path: PATHS.APP.VIOLATION_CATEGORIES,
                    element: <ViolationCategories />,
                  },
                  {
                    path: PATHS.APP.STAFF_SCHEDULES,
                    element: <StaffSchedules />,
                  },
                ],
              },
            ],
          },
        ],
      },

    ],
  },
]);

