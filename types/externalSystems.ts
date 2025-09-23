/**
 * External Systems Types
 */

export interface ExternalProject {
  id: string;
  external_id: string;
  source_system: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags: string[];
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  current_participants: number;
  requirements?: string;
  skills_learned: string[];
  project_url?: string;
  repository_url?: string;
  contact_info?: any;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalSession {
  id: string;
  external_id: string;
  source_system: string;
  title: string;
  description?: string;
  session_type: 'workshop' | 'seminar' | 'study_group' | 'mentoring';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  tags: string[];
  scheduled_at?: string;
  duration_minutes?: number;
  max_participants?: number;
  current_participants: number;
  language: string;
  session_url?: string;
  meeting_id?: string;
  password?: string;
  host_info?: any;
  requirements?: string;
  materials_url?: string;
  recording_url?: string;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExternalAccommodation {
  id: string;
  external_id: string;
  source_system: string;
  name: string;
  description?: string;
  accommodation_type: 'apartment' | 'house' | 'room' | 'dormitory';
  status: 'available' | 'booked' | 'maintenance' | 'unavailable';
  location?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity?: number;
  amenities: string[];
  price_per_night?: number;
  currency: string;
  minimum_stay_nights: number;
  maximum_stay_nights?: number;
  check_in_time?: string;
  check_out_time?: string;
  house_rules: string[];
  cancellation_policy?: string;
  images_urls: string[];
  booking_url?: string;
  contact_info?: any;
  availability_calendar?: any;
  rating?: number;
  review_count: number;
  host_info?: any;
  metadata?: any;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserProjectParticipation {
  id: string;
  user_id: string;
  project_id: string;
  participation_status: 'interested' | 'applied' | 'accepted' | 'active' | 'completed' | 'withdrawn';
  role?: string;
  joined_at: string;
  completed_at?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  external_projects_cache?: ExternalProject;
}

export interface UserSessionRegistration {
  id: string;
  user_id: string;
  session_id: string;
  registration_status: 'registered' | 'attended' | 'no_show' | 'cancelled';
  registered_at: string;
  attended_at?: string;
  feedback_rating?: number;
  feedback_comment?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  external_sessions_cache?: ExternalSession;
}

export interface UserAccommodationBooking {
  id: string;
  user_id: string;
  accommodation_id: string;
  booking_status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_price?: number;
  currency: string;
  external_booking_id?: string;
  booking_url?: string;
  special_requests?: string;
  booking_notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  // Joined data
  external_accommodations_cache?: ExternalAccommodation;
}

export interface UserExternalConnection {
  id: string;
  user_id: string;
  external_system: string;
  external_user_id?: string;
  connection_data?: any;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// Filter interfaces
export interface ExternalProjectFilter {
  source_system?: string;
  status?: string;
  category?: string;
  difficulty_level?: string;
  search?: string;
}

export interface ExternalSessionFilter {
  source_system?: string;
  status?: string;
  category?: string;
  session_type?: string;
  upcoming_only?: boolean;
  language?: string;
}

export interface ExternalAccommodationFilter {
  source_system?: string;
  status?: string;
  accommodation_type?: string;
  location?: string;
  max_price?: number;
  min_capacity?: number;
  amenities?: string[];
}

// Request interfaces
export interface CreateProjectParticipationRequest {
  project_id: string;
  role?: string;
  notes?: string;
}

export interface CreateSessionRegistrationRequest {
  session_id: string;
}

export interface CreateAccommodationBookingRequest {
  accommodation_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  special_requests?: string;
}

export interface UpdateBookingRequest {
  booking_status?: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  booking_notes?: string;
}

export interface SessionFeedbackRequest {
  feedback_rating: number;
  feedback_comment?: string;
}