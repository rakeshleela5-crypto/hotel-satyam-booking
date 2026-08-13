// BACKEND: Replace mock implementations with real API calls
// const BASE_URL = "https://api.yourdomain.workers.dev";
// return fetch(`${BASE_URL}/availability?...`).then(r => r.json());

export async function bookRoom(payload) {
  // payload: { roomType, checkIn, checkOut, name, phone, guests }
  // Returns: { success: true, bookingId: "HS-12345" }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { 
    success: true, 
    bookingId: `HS-${Math.floor(10000 + Math.random() * 90000)}` 
  };
}

export async function joinWaitlist(payload) {
  // payload: { roomType, preferredDates, name, phone }
  // Returns: { success: true }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true };
}
