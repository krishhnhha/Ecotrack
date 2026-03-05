export interface Household {
  id: number;
  owner_name: string;
  address: string;
  ward: string;
  members: number;
  phone: string;
  registration_date: string;
  is_active: number;
}

export interface WasteCategory {
  id: number;
  name: string;
  type: string;
  description: string;
  disposal_method: string;
  color: string;
}

export interface CollectionSchedule {
  id: number;
  household_id: number;
  waste_category_id: number;
  day_of_week: string;
  time_slot: string;
  collector_team: string;
  schedule_date: string;
  status: string;
}

export interface Complaint {
  id: number;
  household_id: number;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  filed_date: string;
  resolved_date: string | null;
}

export interface Penalty {
  id: number;
  household_id: number;
  violation: string;
  description: string;
  amount: number;
  issued_date: string;
  due_date: string;
  status: string;
}

export interface RecyclingUnit {
  id: number;
  name: string;
  location: string;
  capacity_tons: number;
  current_load_tons: number;
  waste_category_id: number;
  operational_status: string;
  contact: string;
}
