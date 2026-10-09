export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  is_active: boolean;
  created_at: string;
}

export interface Workshop {
  id: number;
  code: string | null;
  title: string;
  instructor: string | null;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: "scheduled" | "cancelled" | "completed";
  active_registrations_count: number;
  available_seats: number;
  is_full: boolean;
  is_open_for_booking: boolean;
  created_by?: User | null;
  updated_by?: User | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: number;
  workshop_id: number;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: "active" | "cancelled";
  workshop?: {
    id: number;
    code?: string | null;
    title: string;
    instructor?: string | null;
    starts_at: string;
    location: string | null;
  };
  registered_by?: User | null;
  cancelled_by?: User | null;
  cancelled_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface ApiError {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}
