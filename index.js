const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server running');
});

const wss = new WebSocket.Server({ server });
const clients = new Map(); // Store connected clients and their usernames

wss.on('connection', (ws) => {
  console.log('A new WebSocket connection established');

  console.log(ws)
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      console.log(message)

      if (parsedMessage.username) {
        const username = parsedMessage.username;

        // Store the WebSocket connection and username in the clients Map
        clients.set(ws, { username });

        // Notify other clients about the new user joining
        broadcastUserList();
      } else if (parsedMessage.text && parsedMessage.recipient) {
        // Handle chat messages
        handleMessage(parsedMessage, ws);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');

    // Remove the client and username from the Map when they disconnect
    if (clients.has(ws)) {
      clients.delete(ws);

      // Notify other clients about the user leaving
      broadcastUserList();
    }
  });
});

function broadcastUserList() {
  const userList = Array.from(clients.values()).map((client) => client.username);
  const messageData = { userList };

  // Broadcast the updated user list to all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageData));
    }
  });
}

function handleMessage(messageData, senderWs) {
  const recipient = messageData.recipient;
  const text = messageData.text;

  clients.forEach((clientData, clientWs) => {
    if (clientData.username === recipient && clientWs !== senderWs) {
      const message = {
        sender: clients.get(senderWs).username,
        text,
      };

      // Send the message to the recipient
      clientWs.send(JSON.stringify(message));
    }
  });
}

server.listen(3000, () => {
  console.log('WebSocket server is listening on port 3000');
});
