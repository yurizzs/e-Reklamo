export interface VehicleType {
  id: number;
  vehicle_name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}
