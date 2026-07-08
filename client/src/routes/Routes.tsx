import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "./path";
import { ProtectedRoute, OperatorRoute, RoleRoute } from "./guards";
import RootLayout from "./RootLayout";

// Lazy Loading
const Login = React.lazy(() => import("../pages/auth/Login"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const Users = React.lazy(() => import("../pages/user/User"));
const ViewUserDetail = React.lazy(() => import("../pages/user/components/ViewUserModal"));
const ActivityLogs = React.lazy(() => import("../pages/logs/ActivityLogs"));

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
                element: <Dashboard />,
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
                ],
              },
            ],
          },
        ],
      },

    ],
  },
]);
