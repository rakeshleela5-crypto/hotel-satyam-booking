const API_BASE_URL = '';

async function request(path, options = {}) {
  const response = await fetch(`${ API_BASE_URL }${ path }`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `Request failed with status ${ response.status }`
    );
  }

  return data;
}

export async function bookRoom(payload) {
  return request('/api/bookings/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function createOrder(payload) {
  return request('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyPayment(payload) {
  return request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getRooms() {
  return request('/api/rooms', {
    method: 'GET'
  });
}

export async function checkAvailability(checkIn, checkOut, roomType) {
  const params = new URLSearchParams({
    checkIn,
    checkOut,
    roomType
  });

  return request(`/api/availability?${ params.toString() }`, {
    method: 'GET'
  });
}

export async function cancelBooking(
  bookingId,
  payload = {}
) {
  return request(`/api/bookings/${ bookingId }/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function adminLogin(password) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

export async function getAdminBookings() {
  return request('/api/admin/bookings', {
    method: 'GET'
  });
}

export async function joinWaitlist(payload) {
  return request('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function signupUser(payload) {
  return payload;
}

export async function blockRoomDates(payload) {
  return request('/api/admin/block-room', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getBlockedDates() {
  return request('/api/admin/blocked-dates', {
    method: 'GET'
  });
}

export async function unblockRoomDate(bookingId) {
  return request('/api/admin/unblock-room', {
    method: 'POST',
    body: JSON.stringify({ bookingId })
  });
}

export async function getAdminRoomsList() {
  return request('/api/admin/rooms-list', {
    method: 'GET'
  });
}

export async function apiCall(url, options = {}) {
  return request(url, options);
}

// AI Automation Client Helpers
export async function parseBookingIntent(message) {
  return request('/api/ai/parse-booking-intent', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
}

export async function verifyIdOcr(payload) {
  return request('/api/ai/ocr-id-verification', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function submitPreCheckin(payload) {
  return request('/api/ai/pre-checkin', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function conciergeChat(payload) {
  return request('/api/ai/concierge-chat', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function dispatchServiceRequest(payload) {
  return request('/api/ai/service-request', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getServiceTickets() {
  return request('/api/ai/service-tickets', {
    method: 'GET'
  });
}

export async function updateServiceTicketStatus(ticketId, status) {
  return request('/api/ai/service-tickets/update-status', {
    method: 'POST',
    body: JSON.stringify({ ticketId, status })
  });
}

export async function generateItinerary(payload) {
  return request('/api/ai/generate-itinerary', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getDynamicPricing(checkIn) {
  const query = checkIn ? `?checkIn=${checkIn}` : '';
  return request(`/api/ai/dynamic-pricing${query}`, {
    method: 'GET'
  });
}

export async function generateReviewResponse(payload) {
  return request('/api/ai/generate-review-response', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function submitGuestFeedback(payload) {
  return request('/api/ai/submit-feedback', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function assessBookingRisk(payload) {
  return request('/api/ai/risk-assessment', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getAutoReleaseScan() {
  return request('/api/ai/auto-release-scan', {
    method: 'GET'
  });
}

export async function getOtaRateParity(checkIn) {
  const query = checkIn ? `?checkIn=${checkIn}` : '';
  return request(`/api/ai/ota-rate-parity${query}`, {
    method: 'GET'
  });
}

export async function getPreArrivalUpsells(payload) {
  return request('/api/ai/pre-arrival-upsell', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function acceptPreArrivalUpsell(payload) {
  return request('/api/ai/accept-upsell', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getAdminFeedbacks() {
  return request('/api/ai/feedbacks', {
    method: 'GET'
  });
}