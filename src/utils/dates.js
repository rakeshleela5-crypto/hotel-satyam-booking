export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

export function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate < end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

export function isPastDate(dateStr) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function formatStayDisplay(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  const startStr = start.toLocaleDateString('en-IN', options);
  const endStr = end.toLocaleDateString('en-IN', options);
  const nights = calculateNights(checkIn, checkOut);
  
  return `${startStr} - ${endStr} (${nights} Night${nights > 1 ? 's' : ''})`;
}

export function formatIndianDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-IN', options);
}
