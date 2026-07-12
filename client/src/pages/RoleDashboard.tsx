import { useAuth } from "../contexts/AuthContext";
import Dashboard from "./Dashboard";
import StaffDashboard from "./staff/StaffDashboard";

const RoleDashboard = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Dashboard />;
  }

  return <StaffDashboard />;
};

export default RoleDashboard;
