// BACKEND: Replace mock implementations with real API calls
// const BASE_URL = "https://api.yourdomain.workers.dev";
// return fetch(`${BASE_URL}/availability?...`).then(r => r.json());

export async function bookRoom(payload) {
  const response = await fetch('/api/bookRoom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to book room');
  }
  
  return response.json();
}

export async function joinWaitlist(payload) {
  const response = await fetch('/api/joinWaitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join waitlist');
  }
  
  return response.json();
}

export async function signupUser(payload) {
  const response = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to signup');
  }
  
  return response.json();
}

// RAZORPAY API INTEGRATION
export async function createOrder(payload) {
  const response = await fetch('/api/createOrder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }
  
  return response.json();
}

export async function verifyPayment(payload) {
  const response = await fetch('/api/verifyPayment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to verify payment');
  }
  
  return response.json();
}

export async function apiCall(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('API Call Failed');
  }
  return response.json();
}
