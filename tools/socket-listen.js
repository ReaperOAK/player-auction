const { io } = require('socket.io-client');

const URL = process.env.SOCKET_URL || 'http://localhost:5000';
const socket = io(URL, { transports: ['websocket', 'polling'] });

socket.on('connect', () => {
  console.log('Connected as', socket.id);
  socket.emit('join_room', { role: 'viewer' });
});

socket.on('timer_update', (data) => {
  console.log('timer_update', data);
});

socket.on('bid_update', (data) => {
  console.log('bid_update', data);
});

socket.on('auction_state_update', (data) => {
  console.log('auction_state_update', data.auctionState?.status, 'time_left=', data.auctionState?.time_left);
});

socket.on('connect_error', (err) => { console.error('connect_error', err); });

socket.on('disconnect', (r) => { console.log('disconnect', r); process.exit(0); });

// Keep process alive
setInterval(() => {}, 1000);
