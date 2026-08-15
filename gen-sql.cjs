const fs = require('fs');
let sql = 'INSERT INTO rooms (room_id, hotel_id, room_type_id, room_number, floor_no, room_status) VALUES\n';
for (let i = 302; i <= 330; i++) {
  sql += `('R${i}', 'H100', 'RT103', '${i}', 3, 'available')${i === 330 ? ';' : ','}\n`;
}
fs.writeFileSync('add-business-rooms.sql', sql);
