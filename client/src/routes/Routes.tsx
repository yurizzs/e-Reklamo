import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PATHS } from "./path";

// Lazy Loading
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const Users = React.lazy(() => import("../pages/users/Users"));

export const Routes = createBrowserRouter([

  // Authenticated
  {
    path: PATHS.APP.ROOT,
    children: [
      {
        index: true,
        element: <Navigate to={PATHS.APP.DASHBOARD} replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
    ],
  },

]);