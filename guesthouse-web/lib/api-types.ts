// Mirrors the JSON shape of the backend's ApiResponse<T> payload for the
// endpoints wired so far. Not a full DTO catalogue — extend per-field as each
// new page gets wired to real data (redesign-roadmap.md), rather than
// speculatively typing fields no page reads yet.

export interface RoomDto {
  id: string;
  roomTypeId: string;
  roomTypeName: string;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  building: string;
  maxOccupancy: number;
  operationalStatus: string;
  housekeepingStatus: string;
  derivedStatus: string;
  notes: string | null;
  sortOrder: number;
  // Jackson serializes the Java `boolean isActive` getter as `active`, not
  // `isActive` (its default is-prefix stripping) — confirmed against the
  // live response, not assumed from the DTO source.
  active: boolean;
}

export interface GuestDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  idPassportNumber: string | null;
  nationality: string;
  vipLevel: string;
  notes: string | null;
}

// Body for POST /guests — the backend reuses GuestDto itself as the create
// body (no separate CreateGuestRequest class server-side); `id` is ignored.
export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  idPassportNumber?: string | null;
  nationality?: string;
  vipLevel?: string;
  notes?: string | null;
}

export interface ReservationDto {
  id: string;
  reservationNumber: string;
  mainGuest: GuestDto;
  roomTypeId: string;
  roomTypeName: string;
  assignedRoomId: string | null;
  assignedRoomNumber: string | null;
  arrivalDate: string;
  departureDate: string;
  totalNights: number;
  adults: number;
  children: number;
  baseRate: number;
  discountAmount: number | null;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  reservationStatus: string;
  paymentStatus: string;
  source: string;
  externalReference: string | null;
  specialRequests: string | null;
  internalNotes: string | null;
  version: number;
}

// Body for POST /reservations — mirrors CreateReservationRequest.java.
// `baseRate` is deliberately omitted by callers so the server always derives
// the rate from the room type rather than trusting a client-submitted one
// (conventions.md §6, redesign-roadmap.md Phase 6).
export interface CreateReservationRequest {
  mainGuestId: string;
  roomTypeId: string;
  assignedRoomId?: string | null;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  source?: string;
  specialRequests?: string | null;
  internalNotes?: string | null;
}

// Body for POST /front-desk/check-in — mirrors CheckInRequest.java.
export interface CheckInRequest {
  reservationId: string;
  roomId: string;
  keyNumber?: string | null;
  houseRulesAccepted?: boolean;
  vehiclePlate?: string | null;
  notes?: string | null;
}

// Body for POST /front-desk/check-out — mirrors CheckOutRequest.java. No
// roomId: the backend resolves the room from the reservation's assigned room.
export interface CheckOutRequest {
  reservationId: string;
  keyReturned?: boolean;
  notes?: string | null;
}

export interface AmenityDto {
  id: string;
  category: string;
  name: string;
  iconName: string | null;
  // See RoomDto.active above — same Jackson is-prefix stripping applies to
  // the entity's `isGlobal` getter.
  global: boolean;
}

export interface RoomTypeDto {
  id: string;
  name: string;
  code: string;
  description: string | null;
  basePrice: number;
  extraBedPrice: number;
  extraPersonPrice: number;
  cleaningFee: number;
  defaultDeposit: number;
  maxAdults: number;
  maxChildren: number;
  bedCount: number;
  bedType: string;
  roomSizeSqm: number | null;
  sortOrder: number;
  amenityIds: string[];
  amenities: AmenityDto[];
  // See RoomDto.active above — same Jackson is-prefix stripping applies here.
  active: boolean;
}

// Body for POST/PUT /room-types — mirrors RoomTypeDto.java. The same DTO
// shape is reused as a request body by the backend; `id`/`amenities` are
// ignored server-side on write, so callers can omit them.
export interface RoomTypeRequest {
  name: string;
  code: string;
  description?: string | null;
  basePrice: number;
  extraBedPrice?: number;
  extraPersonPrice?: number;
  cleaningFee?: number;
  defaultDeposit?: number;
  maxAdults?: number;
  maxChildren?: number;
  bedCount?: number;
  bedType?: string;
  roomSizeSqm?: number | null;
  sortOrder?: number;
  amenityIds?: string[];
  active?: boolean;
}

// Body for POST /rooms/bulk-create — mirrors BulkCreateRoomsRequest.java.
export interface BulkCreateRoomsRequest {
  roomTypeId: string;
  startNumber: number;
  endNumber: number;
  floor?: number;
  building?: string;
  prefix?: string;
}

// Body for POST /rooms/blocks — mirrors RoomBlockDto.java.
export interface RoomBlockDto {
  id?: string;
  roomId: string;
  roomNumber?: string;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string | null;
}

// Mirrors HousekeepingTaskDto.java. `status` has no server-side enum
// validation (OperationsService.updateHousekeepingTaskStatus compares the
// raw string) — the frontend is the only place these values are enforced.
export interface HousekeepingTaskDto {
  id: string;
  roomId: string;
  roomNumber: string;
  taskType: string;
  priority: string;
  status: string;
  notes: string | null;
  scheduledDate: string;
  completedAt: string | null;
}

// Mirrors MaintenanceIssueDto.java.
export interface MaintenanceIssueDto {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  // See RoomDto.active above — same Jackson is-prefix stripping applies to
  // the entity's `isBlocking` getter.
  blocking: boolean;
  resolvedAt: string | null;
}

// Body for POST /maintenance/issues — mirrors ReportIssueRequest.java.
export interface ReportIssueRequest {
  roomId: string;
  title: string;
  description?: string | null;
  severity?: string;
  isBlocking?: boolean;
}

export interface PaymentDto {
  id: string;
  paymentNumber: string;
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  amount: number;
  paymentMethod: string;
  paymentKind: string;
  status: string;
  transactionReference: string | null;
  paymentTime: string;
}

// Body for POST /payments — mirrors RecordPaymentRequest.java.
export interface RecordPaymentRequest {
  reservationId: string;
  amount: number;
  paymentMethod?: string;
  paymentKind?: string;
  transactionReference?: string | null;
  notes?: string | null;
}

// Mirrors InvoiceDto.java. Read-only — no POST/issue endpoint exists yet
// (the backend has no invoice-generation code path at all).
export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  guestName: string;
  invoiceType: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  issuedAt: string;
}

export interface ExpenseDto {
  id: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string | null;
  paymentMethod: string;
  approvalStatus: string;
  notes: string | null;
}

// Body for POST /expenses — mirrors CreateExpenseRequest.java. Expenses are
// auto-approved server-side on creation (ExpenseService "auto approve in
// local mode"), so there is no pending-approval state to build UI for today.
export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  expenseDate?: string;
  vendor?: string | null;
  paymentMethod?: string;
  notes?: string | null;
}
