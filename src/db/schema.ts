export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_name TEXT NOT NULL,
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  members INTEGER DEFAULT 1,
  phone TEXT,
  registration_date TEXT,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS waste_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  description TEXT,
  disposal_method TEXT,
  color TEXT DEFAULT '#10b981'
);

CREATE TABLE IF NOT EXISTS collection_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL,
  waste_category_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL,
  time_slot TEXT,
  collector_team TEXT,
  schedule_date TEXT,
  status TEXT DEFAULT 'Scheduled',
  FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Open',
  filed_date TEXT,
  resolved_date TEXT,
  FOREIGN KEY (household_id) REFERENCES households(id)
);

CREATE TABLE IF NOT EXISTS penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id INTEGER NOT NULL,
  violation TEXT NOT NULL,
  description TEXT,
  amount REAL DEFAULT 0,
  issued_date TEXT,
  due_date TEXT,
  status TEXT DEFAULT 'Pending',
  FOREIGN KEY (household_id) REFERENCES households(id)
);

CREATE TABLE IF NOT EXISTS recycling_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  capacity_tons REAL DEFAULT 0,
  current_load_tons REAL DEFAULT 0,
  waste_category_id INTEGER,
  operational_status TEXT DEFAULT 'Active',
  contact TEXT,
  FOREIGN KEY (waste_category_id) REFERENCES waste_categories(id)
);
`;

export const SEED_SQL = `
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Organic Waste', 'Biodegradable', 'Food scraps, garden waste, and other biodegradable materials', 'Composting', '#22c55e');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Plastic', 'Recyclable', 'Plastic bottles, containers, and packaging materials', 'Recycling Plant', '#3b82f6');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Paper & Cardboard', 'Recyclable', 'Newspapers, cardboard boxes, office paper', 'Recycling Plant', '#f59e0b');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Glass', 'Recyclable', 'Glass bottles, jars, and containers', 'Recycling Plant', '#8b5cf6');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Metal', 'Recyclable', 'Aluminum cans, tin cans, metal scraps', 'Recycling Plant', '#6b7280');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('E-Waste', 'Hazardous', 'Electronic devices, batteries, circuit boards', 'Specialized Facility', '#ef4444');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('Hazardous Waste', 'Hazardous', 'Chemicals, paint, medical waste', 'Specialized Facility', '#dc2626');
INSERT INTO waste_categories (name, type, description, disposal_method, color) VALUES
  ('General Waste', 'Non-Recyclable', 'Mixed waste not fitting other categories', 'Landfill', '#9ca3af');

INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Rajesh Kumar', '12 MG Road, Sector 5', 'Ward A', 4, '9876543210', '2024-01-15', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Priya Sharma', '45 Gandhi Nagar, Block B', 'Ward A', 3, '9876543211', '2024-01-20', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Amit Patel', '78 Nehru Street, Sector 12', 'Ward B', 5, '9876543212', '2024-02-01', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Sunita Devi', '23 Tagore Lane, Block C', 'Ward B', 2, '9876543213', '2024-02-10', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Mohammed Ali', '56 Park Avenue, Sector 8', 'Ward C', 6, '9876543214', '2024-02-15', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Lakshmi Iyer', '90 Temple Road, Block A', 'Ward C', 3, '9876543215', '2024-03-01', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Vikram Singh', '34 Civil Lines, Sector 3', 'Ward D', 4, '9876543216', '2024-03-10', 0);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Anita Gupta', '67 Market Street, Block D', 'Ward D', 2, '9876543217', '2024-03-15', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Suresh Reddy', '11 Lake View, Sector 7', 'Ward E', 5, '9876543218', '2024-04-01', 1);
INSERT INTO households (owner_name, address, ward, members, phone, registration_date, is_active) VALUES
  ('Fatima Khan', '88 Green Park, Block E', 'Ward E', 3, '9876543219', '2024-04-10', 1);

INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (1, 1, 'Monday', '08:00 - 10:00', 'Team Alpha', '2025-01-06', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (1, 2, 'Thursday', '08:00 - 10:00', 'Team Alpha', '2025-01-09', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (2, 1, 'Monday', '10:00 - 12:00', 'Team Alpha', '2025-01-06', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (3, 1, 'Tuesday', '08:00 - 10:00', 'Team Beta', '2025-01-07', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (3, 3, 'Friday', '08:00 - 10:00', 'Team Beta', '2025-01-10', 'Scheduled');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (4, 1, 'Tuesday', '10:00 - 12:00', 'Team Beta', '2025-01-07', 'Missed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (5, 1, 'Wednesday', '08:00 - 10:00', 'Team Gamma', '2025-01-08', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (5, 6, 'Wednesday', '14:00 - 16:00', 'Team Delta', '2025-01-08', 'Scheduled');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (6, 1, 'Wednesday', '10:00 - 12:00', 'Team Gamma', '2025-01-08', 'Completed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (7, 1, 'Thursday', '08:00 - 10:00', 'Team Alpha', '2025-01-09', 'Missed');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (8, 8, 'Thursday', '10:00 - 12:00', 'Team Alpha', '2025-01-09', 'Scheduled');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (9, 1, 'Friday', '08:00 - 10:00', 'Team Beta', '2025-01-10', 'Scheduled');
INSERT INTO collection_schedules (household_id, waste_category_id, day_of_week, time_slot, collector_team, schedule_date, status) VALUES
  (10, 1, 'Friday', '10:00 - 12:00', 'Team Beta', '2025-01-10', 'Completed');

INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (1, 'Missed Collection', 'Waste was not collected on scheduled Monday', 'Missed Pickup', 'High', 'Resolved', '2025-01-07', '2025-01-08');
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (3, 'Overflowing Bin', 'Community bin near Sector 12 is overflowing', 'Overflow', 'Critical', 'In Progress', '2025-01-08', NULL);
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (4, 'Bad Smell', 'Rotting waste causing bad smell near Block C', 'Smell', 'High', 'Open', '2025-01-09', NULL);
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (5, 'Improper Disposal', 'Neighbor dumping hazardous waste in regular bin', 'Improper Disposal', 'Critical', 'Open', '2025-01-10', NULL);
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (7, 'Late Collection', 'Collection team arrives 3 hours late regularly', 'Missed Pickup', 'Medium', 'Open', '2025-01-11', NULL);
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (2, 'Broken Bin', 'Community recycling bin is damaged', 'Other', 'Low', 'Resolved', '2025-01-05', '2025-01-12');
INSERT INTO complaints (household_id, subject, description, category, priority, status, filed_date, resolved_date) VALUES
  (9, 'No Segregation Bins', 'Ward E lacks separate bins for waste types', 'Other', 'Medium', 'In Progress', '2025-01-12', NULL);

INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (4, 'Improper Segregation', 'Mixed hazardous waste with organic waste', 500.00, '2025-01-08', '2025-01-22', 'Pending');
INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (7, 'Illegal Dumping', 'Dumped construction waste in community area', 2000.00, '2025-01-09', '2025-01-23', 'Pending');
INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (5, 'Hazardous Violation', 'Disposed of chemicals without proper containment', 1500.00, '2025-01-10', '2025-01-24', 'Overdue');
INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (1, 'Missed Schedule', 'Failed to put out waste on collection day 3 times', 250.00, '2025-01-06', '2025-01-20', 'Paid');
INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (3, 'Improper Segregation', 'Plastic mixed with organic waste repeatedly', 500.00, '2025-01-11', '2025-01-25', 'Pending');
INSERT INTO penalties (household_id, violation, description, amount, issued_date, due_date, status) VALUES
  (8, 'Illegal Dumping', 'Found dumping waste in vacant lot', 2500.00, '2025-01-12', '2025-01-26', 'Overdue');

INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('Green Recycle Hub', 'Industrial Area, Sector 15', 50.0, 32.5, 2, 'Active', '011-2345678');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('EcoPaper Mill', 'Paper Mill Road, Sector 20', 30.0, 18.0, 3, 'Active', '011-3456789');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('GlassCraft Unit', 'MIDC Area, Block F', 25.0, 22.0, 4, 'Active', '011-4567890');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('MetalWorks Recycling', 'Industrial Estate, Sector 18', 40.0, 15.0, 5, 'Active', '011-5678901');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('TechRecycle Center', 'IT Park, Sector 22', 10.0, 8.5, 6, 'Under Maintenance', '011-6789012');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('CompostKing Facility', 'Agricultural Zone, Ward A', 60.0, 45.0, 1, 'Active', '011-7890123');
INSERT INTO recycling_units (name, location, capacity_tons, current_load_tons, waste_category_id, operational_status, contact) VALUES
  ('SafeDispose Unit', 'Hazmat Road, Sector 25', 15.0, 5.0, 7, 'Active', '011-8901234');
`;
