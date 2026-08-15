const fs = require('fs');

let sql = 'INSERT INTO rooms (room_id, hotel_id, room_type_id, room_number, floor_no, room_status) VALUES\n';
let values = [];

// Standard: RT-STD. Current: 101, 102, 103. Need 57 more (60 total)
for(let i=4; i<=60; i++) {
    values.push(`('RM-10${i}', 'H-001', 'RT-STD', '10${i}', 1, 'available')`);
}

// Deluxe: RT-DLX. Current: 201, 202, 203. Need 53 more (56 total)
for(let i=4; i<=56; i++) {
    values.push(`('RM-20${i}', 'H-001', 'RT-DLX', '20${i}', 2, 'available')`);
}

// Business Suite: RT-BSN. Current: 301, 302. Need 32 more (34 total)
for(let i=3; i<=34; i++) {
    values.push(`('RM-30${i}', 'H-001', 'RT-BSN', '30${i}', 3, 'available')`);
}

sql += values.join(',\n') + ';';
fs.writeFileSync('add-more-rooms.sql', sql);
