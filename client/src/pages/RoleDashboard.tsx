import { useAuth } from "../contexts/AuthContext";
import Dashboard from "./Dashboard";
import StaffDashboard from "./staff/StaffDashboard";
import CitizenDashboard from "./citizen/CitizenDashboard";

const RoleDashboard = () => {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Dashboard />;
  }

  if (user?.role === "citizen") {
    return <CitizenDashboard />;
  }

  return <StaffDashboard />;
};

export default RoleDashboard;
