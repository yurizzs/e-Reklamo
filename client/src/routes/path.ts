const APP_ROOT = "/app";

export const PATHS = {
  // Public Routes
  HOME: "/",
  LOGIN: "/login",

  // Authenticated
  APP: {
    ROOT: `${APP_ROOT}`,
    DASHBOARD: `${APP_ROOT}/dashboard`,
    USERS: `${APP_ROOT}/users`,
    USER_DETAIL: `${APP_ROOT}/users/:slug`,
    LOGS: `${APP_ROOT}/logs`,
    COMPLAINTS: `${APP_ROOT}/complaints`,
    ANALYTICS: `${APP_ROOT}/analytics`,
    VIOLATION_CATEGORIES: `${APP_ROOT}/violation-categories`,
    STAFF_SCHEDULES: `${APP_ROOT}/staff-schedules`,
  },
};
