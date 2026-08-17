// Helper to parse 'YYYY-MM-DD' exactly in local time without UTC offset bugs
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function getLocalDateString(offsetDays = 0) {
  const date = new Date();
  if (offsetDays !== 0) {
    date.setDate(date.getDate() + offsetDays);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMinCheckOutDate(checkInStr) {
  if (!checkInStr) {
    return getLocalDateString(1);
  }
  const d = parseLocalDate(checkInStr);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Strict night calculation: (Check-out Date - Check-in Date) in days
 */
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  
  if (end <= start) return 0;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  return Math.max(1, diffDays);
}

export function generateDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  
  while (currentDate < end) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function isPastDate(dateStr) {
  if (!dateStr) return false;
  const date = parseLocalDate(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function formatStayDisplay(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-IN', options);
  const endStr = end.toLocaleDateString('en-IN', options);
  const nights = calculateNights(checkIn, checkOut);
  
  return `${startStr} - ${endStr} (${nights} Night${nights > 1 ? 's' : ''})`;
}

export function formatIndianDate(dateStr) {
  if (!dateStr) return "";
  const date = parseLocalDate(dateStr);
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}

/**
 * Extra Guest Pricing Calculator
 * Base capacity: 2 adults included
 * Extra guest fee: ₹400/guest/night (or custom per room)
 */
export function calculateStayPricing({
  basePrice = 1499,
  checkIn,
  checkOut,
  guests = 1,
  baseCapacity = 2,
  extraGuestRate = 400
}) {
  const nights = calculateNights(checkIn, checkOut);
  const numGuests = Number(guests) || 1;
  const extraGuests = Math.max(0, numGuests - baseCapacity);
  const extraGuestFeePerNight = extraGuests * extraGuestRate;
  
  const roomTotal = basePrice * nights;
  const extraGuestTotal = extraGuestFeePerNight * nights;
  const subtotal = roomTotal + extraGuestTotal;
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax;

  return {
    nights,
    basePrice,
    roomTotal,
    numGuests,
    baseCapacity,
    extraGuests,
    extraGuestRate,
    extraGuestTotal,
    subtotal,
    tax,
    total
  };
}

