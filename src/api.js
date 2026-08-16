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

export async function joinWaitlist() {
  throw new Error(
    'Waitlist is not available yet because the current server.js has no waitlist route.'
  );
}

export async function signupUser(payload) {
  return payload;
}

export async function apiCall(url, options = {}) {
  return request(url, options);
}