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
