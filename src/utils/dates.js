// Helper to parse 'YYYY-MM-DD' exactly in local time
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-');
  return new Date(year, month - 1, day);
}

export function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = parseLocalDate(checkIn);
  const end = parseLocalDate(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}

export function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = parseLocalDate(startDate);
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
  date.setHours(0, 0, 0, 0);
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
