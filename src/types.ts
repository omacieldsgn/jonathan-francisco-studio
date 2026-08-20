export interface Business {
  id: string;
  name: string;
  slug: string;
  phone: string;
  whatsapp: string;
  email: string;
  instagramUrl: string;
  address: string;
  timezone: string;
  logoUrl?: string;
  coverUrl?: string;
  status: 'active' | 'inactive';
}

export interface UserProfile {
  id: string; // matches username/email
  role: 'admin' | 'professional' | 'receptionist' | 'customer';
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Professional {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  services: string[]; // service IDs this professional can execute
  active: boolean;
  displayOrder: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  active: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl?: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  priceCents: number;
  promotionalPriceCents?: number;
  onlineBookingEnabled: boolean;
  active: boolean;
  displayOrder: number;
}

export interface BusinessHours {
  weekday: number; // 0 (Sunday) to 6 (Saturday)
  opensAt: string; // "HH:MM"
  closesAt: string; // "HH:MM"
  active: boolean;
}

export interface ProfessionalHours {
  professionalId: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface ScheduleException {
  id: string;
  professionalId?: string; // if empty, applies to entire business
  startsAt: string; // ISO String (UTC)
  endsAt: string; // ISO String (UTC)
  type: 'closed' | 'blocked' | 'extra_hours' | 'vacation' | 'break';
  reason: string;
}

export interface Appointment {
  id: string;
  shortCode: string; // e.g. "JF-82A1"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  professionalId: string;
  professionalName: string;
  startsAt: string; // ISO String (UTC)
  endsAt: string; // ISO String (UTC)
  status: 'pending' | 'confirmed' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: 'cash_or_card' | 'online_pix' | 'online_card';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  customerNote?: string;
  internalNote?: string;
  source: 'web' | 'admin' | 'whatsapp' | 'walk_in';
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentItem {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  durationMinutesSnapshot: number;
  unitPriceCentsSnapshot: number;
}

export interface WaitlistEntry {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  professionalId?: string; // specific or "any"
  preferredDateStart: string; // YYYY-MM-DD
  preferredDateEnd: string;
  preferredPeriods: ('morning' | 'afternoon' | 'evening')[];
  serviceIds: string[];
  status: 'active' | 'offered' | 'confirmed' | 'expired' | 'cancelled';
  expiresAt?: string;
  createdAt: string;
}

export interface WaitlistOffer {
  id: string;
  waitlistEntryId: string;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface Coupon {
  id: string;
  code: string; // UPPERCASE normalizado
  discountType: 'percentage' | 'fixed';
  discountValue: number; // percentage (e.g. 10) or cents (e.g. 1500 for R$15)
  startsAt: string;
  endsAt: string;
  maxUses: number;
  currentUses: number;
  minTotalCents: number;
  active: boolean;
}

export interface Review {
  id: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  professionalId: string;
  rating: number; // 1-5
  comment: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt: string;
}

export interface DashboardStats {
  todayAppointmentsCount: number;
  todayCompletedCount: number;
  todayRevenueCents: number;
  averageTicketCents: number;
  occupancyRate: number; // 0 to 100
  cancelledCount: number;
  noShowCount: number;
  waitlistCount: number;
}
