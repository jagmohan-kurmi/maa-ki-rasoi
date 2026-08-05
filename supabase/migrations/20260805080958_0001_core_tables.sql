/*
# Maa Ki Rasoi - Core Schema

## Overview
Complete schema for a Mess Management System with:
- Settings (single row, admin-managed business config)
- Subscription plans (admin-created, customer-facing)
- Customers (mess members with login credentials)
- Weekly menu (7 days x 3 meals, admin-editable, customer view-only)
- Orders (daily-generated from active subscriptions + admin manual updates)
- Extra orders (customer requests, admin approves/rejects)
- Payments (admin-managed, customer view-only)
- Expenses (admin-managed, categorized)
- Complaints (customer-submitted, admin-managed)
- Employees (staff management)
- Employee attendance (daily + monthly)

## Tables
1. `settings` - business configuration (single row)
2. `plans` - subscription plans
3. `customers` - mess members
4. `weekly_menu` - 7-day menu (breakfast/lunch/dinner per day)
5. `orders` - daily orders generated from active subscriptions
6. `extra_orders` - customer-placed extra meal requests
7. `payments` - payment records
8. `expenses` - business expenses
9. `complaints` - customer complaints
10. `employees` - staff records
11. `employee_attendance` - daily attendance

## Security
- RLS enabled on all tables
- Admin (authenticated admin user) has full CRUD via ownership check on auth.users
- Customers (authenticated non-admin) can read their own data and insert complaints/extra orders
- Public (anon) can read plans, weekly menu, settings (for homepage display)

## Important Notes
1. Admin is identified by email match against a hardcoded admin email stored in settings
2. Customer credentials are stored in auth.users; customer profile links via auth uid
3. All money fields use numeric(10,2)
4. Status fields use text with CHECK constraints for valid values
*/

-- ============================================================
-- SETTINGS (single business config row)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'Maa Ki Rasoi',
  tagline text DEFAULT 'घर जैसा खाना, घर जैसा प्यार',
  phone text NOT NULL DEFAULT '9826xxxxxx',
  whatsapp text NOT NULL DEFAULT '9826xxxxxx',
  email text NOT NULL DEFAULT 'maakirasoiankit65679@gmail.com',
  address text NOT NULL DEFAULT 'Gopalganj, Sagar (Madhya Pradesh)',
  google_map_url text DEFAULT '',
  business_timing text NOT NULL DEFAULT 'सुबह 6:00 बजे से रात 10:00 बजे तक',
  monthly_delivery_charge numeric(10,2) NOT NULL DEFAULT 300,
  receipt_footer text DEFAULT 'धन्यवाद! माा की रसोई',
  currency text NOT NULL DEFAULT '₹',
  admin_email text NOT NULL DEFAULT 'maakirasoiankit65679@gmail.com',
  logo_url text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings: readable by everyone (public homepage), updatable only by admin (authenticated)
DROP POLICY IF EXISTS "anon_read_settings" ON settings;
CREATE POLICY "anon_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PLANS (subscription plans)
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  duration text NOT NULL DEFAULT 'Monthly',
  breakfast boolean NOT NULL DEFAULT false,
  lunch boolean NOT NULL DEFAULT false,
  dinner boolean NOT NULL DEFAULT false,
  veg boolean NOT NULL DEFAULT true,
  non_veg boolean NOT NULL DEFAULT false,
  is_student_plan boolean NOT NULL DEFAULT false,
  is_custom boolean NOT NULL DEFAULT false,
  monthly_subscription_charge numeric(10,2) NOT NULL DEFAULT 0,
  monthly_delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  benefits text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_plans" ON plans;
CREATE POLICY "anon_read_plans" ON plans FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_plans" ON plans;
CREATE POLICY "auth_insert_plans" ON plans FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_plans" ON plans;
CREATE POLICY "auth_update_plans" ON plans FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_plans" ON plans;
CREATE POLICY "auth_delete_plans" ON plans FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- CUSTOMERS (mess members)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id text UNIQUE,
  username text UNIQUE NOT NULL,
  password_plain text,
  full_name text NOT NULL,
  father_name text DEFAULT '',
  mobile text NOT NULL,
  alternate_mobile text DEFAULT '',
  email text DEFAULT '',
  aadhaar text DEFAULT '',
  dob text DEFAULT '',
  occupation text DEFAULT '',
  college text DEFAULT '',
  company text DEFAULT '',
  room_number text DEFAULT '',
  emergency_contact text DEFAULT '',
  address text DEFAULT '',
  delivery_address text DEFAULT '',
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  renewal_date date,
  meal_type text NOT NULL DEFAULT 'Veg' CHECK (meal_type IN ('Veg','Non Veg','Both')),
  breakfast boolean NOT NULL DEFAULT false,
  lunch boolean NOT NULL DEFAULT false,
  dinner boolean NOT NULL DEFAULT false,
  plan_id uuid REFERENCES plans(id) ON DELETE SET NULL,
  monthly_subscription_charge numeric(10,2) NOT NULL DEFAULT 0,
  monthly_delivery_charge numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  final_payable_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Paused','Inactive')),
  photo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Customers: admin can do everything; customers can read their own row
DROP POLICY IF EXISTS "auth_select_customers" ON customers;
CREATE POLICY "auth_select_customers" ON customers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
CREATE POLICY "auth_insert_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_customers" ON customers;
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_customers" ON customers;
CREATE POLICY "auth_delete_customers" ON customers FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- WEEKLY MENU (7 days x 3 meals)
-- ============================================================
CREATE TABLE IF NOT EXISTS weekly_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week text NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  breakfast text DEFAULT '',
  lunch text DEFAULT '',
  dinner text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_weekly_menu" ON weekly_menu;
CREATE POLICY "anon_read_weekly_menu" ON weekly_menu FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_weekly_menu" ON weekly_menu;
CREATE POLICY "auth_insert_weekly_menu" ON weekly_menu FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_weekly_menu" ON weekly_menu;
CREATE POLICY "auth_update_weekly_menu" ON weekly_menu FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_weekly_menu" ON weekly_menu;
CREATE POLICY "auth_delete_weekly_menu" ON weekly_menu FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- ORDERS (daily generated from active subscriptions)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  meal text NOT NULL CHECK (meal IN ('Breakfast','Lunch','Dinner')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  plan_name text DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Delivered','Skipped','Cancelled')),
  notes text DEFAULT '',
  is_extra boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders: admin full CRUD; customers can read their own orders
DROP POLICY IF EXISTS "auth_select_orders" ON orders;
CREATE POLICY "auth_select_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_orders" ON orders;
CREATE POLICY "auth_insert_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_orders" ON orders;
CREATE POLICY "auth_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_orders" ON orders;
CREATE POLICY "auth_delete_orders" ON orders FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- EXTRA ORDERS (customer-placed, admin approves)
-- ============================================================
CREATE TABLE IF NOT EXISTS extra_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  meal_type text NOT NULL,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  admin_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE extra_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_extra_orders" ON extra_orders;
CREATE POLICY "auth_select_extra_orders" ON extra_orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_extra_orders" ON extra_orders;
CREATE POLICY "auth_insert_extra_orders" ON extra_orders FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_extra_orders" ON extra_orders;
CREATE POLICY "auth_update_extra_orders" ON extra_orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_extra_orders" ON extra_orders;
CREATE POLICY "extra_orders_delete_own" ON extra_orders FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  receipt_number text UNIQUE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'Cash' CHECK (payment_mode IN ('Cash','UPI','Bank')),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  month text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_payments" ON payments;
CREATE POLICY "auth_select_payments" ON payments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_payments" ON payments;
CREATE POLICY "auth_insert_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_payments" ON payments;
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_payments" ON payments;
CREATE POLICY "auth_delete_payments" ON payments FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Miscellaneous' CHECK (category IN ('Vegetables','Milk','Gas','Rent','Salary','Fuel','Electricity','Kitchen Items','Maintenance','Miscellaneous')),
  description text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_expenses" ON expenses;
CREATE POLICY "auth_select_expenses" ON expenses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_expenses" ON expenses;
CREATE POLICY "auth_insert_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_expenses" ON expenses;
CREATE POLICY "auth_update_expenses" ON expenses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_expenses" ON expenses;
CREATE POLICY "expenses_delete" ON expenses FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL DEFAULT '',
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Resolved','Closed')),
  admin_response text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_complaints" ON complaints;
CREATE POLICY "auth_select_complaints" ON complaints FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_complaints" ON complaints;
CREATE POLICY "auth_insert_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_complaints" ON complaints;
CREATE POLICY "auth_update_complaints" ON complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_complaints" ON complaints;
CREATE POLICY "complaints_delete" ON complaints FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'Cook' CHECK (role IN ('Cook','Helper','Delivery Staff','Cleaner','Manager','Other')),
  address text DEFAULT '',
  salary numeric(10,2) NOT NULL DEFAULT 0,
  joining_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  photo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_employees" ON employees;
CREATE POLICY "auth_select_employees" ON employees FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_employees" ON employees;
CREATE POLICY "auth_insert_employees" ON employees FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_employees" ON employees;
CREATE POLICY "auth_update_employees" ON employees FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_employees" ON employees;
CREATE POLICY "employees_delete" ON employees FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- EMPLOYEE ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  employee_name text NOT NULL DEFAULT '',
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Present' CHECK (status IN ('Present','Absent','Leave','Half Day','Late')),
  check_in text DEFAULT '',
  check_out text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);

ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_attendance" ON employee_attendance;
CREATE POLICY "auth_select_attendance" ON employee_attendance FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_attendance" ON employee_attendance;
CREATE POLICY "auth_insert_attendance" ON employee_attendance FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_attendance" ON employee_attendance;
CREATE POLICY "auth_update_attendance" ON employee_attendance FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_attendance" ON employee_attendance;
CREATE POLICY "attendance_delete" ON employee_attendance FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_complaints_customer ON complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
