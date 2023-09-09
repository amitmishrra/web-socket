const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

const clients = new Map(); // Store connected clients and their usernames
app.use(cors({ origin: '*' }));

io.on('connection', (socket) => {
  console.log('A new WebSocket connection established');

  socket.on('join', (username) => {
    clients.set(socket.id, { username });
    broadcastUserList();
  });

  socket.on('chat message', (message) => {
    const senderUsername = clients.get(socket.id).username;
    const { recipient, text } = message;

    io.to(recipient).emit('chat message', {
      sender: senderUsername,
      text,
    });
  });

  socket.on('disconnect', () => {
    console.log('WebSocket connection closed');

    if (clients.has(socket.id)) {
      clients.delete(socket.id);
      broadcastUserList();
    }
  });

  function broadcastUserList() {
    const userList = Array.from(clients.values()).map((client) => client.username);
    io.emit('user list', userList);
  }
});

server.listen(3000, () => {
  console.log('Socket.io server is listening on port 3000');
});
