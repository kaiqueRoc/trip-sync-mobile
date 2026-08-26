import {
  AuthResponseSchema,
  BookingListResponseSchema,
  BookingResponseSchema,
  MockPaymentResultSchema,
  SearchFlightsResponseSchema,
  SeatMapResponseSchema,
  type AuthResponse,
  type BookingListQuery,
  type BookingListResponse,
  type BookingResponse,
  type CabinClass,
  type CreateBookingInput,
  type LoginInput,
  type MockPaymentInput,
  type MockPaymentResult,
  type RegisterInput,
  type SearchFlightsQuery,
  type SearchFlightsResponse,
  type SeatMapResponse,
  type UpdateBookingStatusInput,
} from "@trip-sync/contracts";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean },
  parse: (payload: unknown) => T,
): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.auth && authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Erro na requisição";
    throw new Error(message);
  }

  return parse(payload);
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return request("/auth/login", { method: "POST", body: input }, (p) =>
    AuthResponseSchema.parse(p),
  );
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return request("/auth/register", { method: "POST", body: input }, (p) =>
    AuthResponseSchema.parse(p),
  );
}

export function searchFlights(
  query: SearchFlightsQuery,
): Promise<SearchFlightsResponse> {
  const params = new URLSearchParams({
    origin: query.origin,
    destination: query.destination,
    departureDate: query.departureDate,
    passengers: String(query.passengers),
  });
  return request(`/flights/search?${params}`, {}, (p) =>
    SearchFlightsResponseSchema.parse(p),
  );
}

export function getSeatMap(
  flightId: string,
  cabinClass: CabinClass,
): Promise<SeatMapResponse> {
  const params = new URLSearchParams({ cabinClass });
  return request(`/flights/${flightId}/seatmap?${params}`, {}, (p) =>
    SeatMapResponseSchema.parse(p),
  );
}

export function processMockPayment(
  input: MockPaymentInput,
): Promise<MockPaymentResult> {
  return request("/payments/mock", { method: "POST", body: input }, (p) =>
    MockPaymentResultSchema.parse(p),
  );
}

export function createBooking(
  input: CreateBookingInput,
): Promise<BookingResponse> {
  return request(
    "/bookings",
    { method: "POST", body: input, auth: true },
    (p) => BookingResponseSchema.parse(p),
  );
}

export function updateBookingStatus(
  id: string,
  input: UpdateBookingStatusInput,
): Promise<BookingResponse> {
  return request(
    `/bookings/${id}/status`,
    { method: "PATCH", body: input, auth: true },
    (p) => BookingResponseSchema.parse(p),
  );
}

/** Creates the booking (PENDING) and immediately confirms it, same as the web checkout. */
export async function issueBooking(
  input: CreateBookingInput,
): Promise<BookingResponse> {
  const booking = await createBooking(input);
  return updateBookingStatus(booking.id, { status: "CONFIRMED" });
}

export function getBooking(id: string): Promise<BookingResponse> {
  return request(`/bookings/${id}`, { auth: true }, (p) =>
    BookingResponseSchema.parse(p),
  );
}

export function listBookings(
  query: BookingListQuery,
): Promise<BookingListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status) params.set("status", query.status);
  return request(`/bookings?${params}`, { auth: true }, (p) =>
    BookingListResponseSchema.parse(p),
  );
}
