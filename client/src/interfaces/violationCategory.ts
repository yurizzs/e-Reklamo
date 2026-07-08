export interface ViolationCategory {
  id: number;
  category_name: string;
  description: string | null;
  penalty_amount: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
