export type MealType = 'Veg' | 'Non Veg' | 'Both';
export type CustomerStatus = 'Active' | 'Paused' | 'Inactive';
export type OrderStatus = 'Pending' | 'Delivered' | 'Skipped' | 'Cancelled';
export type OrderMeal = 'Breakfast' | 'Lunch' | 'Dinner';
export type ExtraOrderStatus = 'Pending' | 'Approved' | 'Rejected';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank';
export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type EmployeeRole = 'Cook' | 'Helper' | 'Delivery Staff' | 'Cleaner' | 'Manager' | 'Other';
export type EmployeeStatus = 'Active' | 'Inactive';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Half Day' | 'Late';
export type ExpenseCategory =
  | 'Vegetables' | 'Milk' | 'Gas' | 'Rent' | 'Salary' | 'Fuel'
  | 'Electricity' | 'Kitchen Items' | 'Maintenance' | 'Miscellaneous';

export interface Settings {
  id: string;
  business_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  google_map_url: string;
  business_timing: string;
  monthly_delivery_charge: number;
  receipt_footer: string;
  currency: string;
  admin_email: string;
  logo_url: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  duration: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  veg: boolean;
  non_veg: boolean;
  is_student_plan: boolean;
  is_custom: boolean;
  monthly_subscription_charge: number;
  monthly_delivery_charge: number;
  description: string;
  benefits: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id: string | null;
  customer_id: string | null;
  username: string;
  password_plain: string | null;
  full_name: string;
  father_name: string;
  mobile: string;
  alternate_mobile: string;
  email: string;
  aadhaar: string;
  dob: string;
  occupation: string;
  college: string;
  company: string;
  room_number: string;
  emergency_contact: string;
  address: string;
  delivery_address: string;
  joining_date: string;
  renewal_date: string | null;
  meal_type: MealType;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  plan_id: string | null;
  monthly_subscription_charge: number;
  monthly_delivery_charge: number;
  discount: number;
  final_payable_amount: number;
  status: CustomerStatus;
  photo_url: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyMenu {
  id: string;
  day_of_week: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  sort_order: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  meal: OrderMeal;
  order_date: string;
  plan_name: string;
  status: OrderStatus;
  notes: string;
  is_extra: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtraOrder {
  id: string;
  customer_id: string;
  customer_name: string;
  meal_type: string;
  request_date: string;
  notes: string;
  status: ExtraOrderStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  receipt_number: string | null;
  amount: number;
  payment_mode: PaymentMode;
  payment_date: string;
  month: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  customer_id: string;
  customer_name: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  admin_response: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  employee_id: string | null;
  name: string;
  phone: string;
  role: EmployeeRole;
  address: string;
  salary: number;
  joining_date: string;
  status: EmployeeStatus;
  photo_url: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAttendance {
  id: string;
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in: string;
  check_out: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
