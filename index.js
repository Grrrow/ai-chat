require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const countries = require('./countries.json');
const translateMessage = require('./translate');

// Create the Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json())

app.get('/countries', (req, res) => {
  res.status(200);
  res.send(countries);
})

app.post('/translate', async (req, res) => {
  const translatedMsg = await translateMessage(countries[req.body.country].locale, req.body.message)
  res.send(translatedMsg);
})

// Initialize Socket.IO server
const io = socketIO(server);

// Handle new connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Listen for 'join' events and store the username
  socket.on('join', ({ username, country }) => {
    socket.username = username;
    socket.country = country;
    console.log(`${username} from ${country} joined the chat.`);
  });

  socket.on('user_typing', () => {
    socket.broadcast.emit('typing_status_updated', 'Someone is typing...');
  });

  // Listen for 'user_stopped_typing' events
  socket.on('user_stopped_typing', () => {
    socket.broadcast.emit('typing_status_updated', '');
  });

  // Listen for 'send_message' events
  socket.on('send_message', (message) => {
    console.log('Message received:', message);

    const messageData = {
      username: socket.username,
      country: socket.country,
      content: message,
    };

    // Broadcast 'receive_message' event to all clients
    io.emit('receive_message', messageData);
  });

  // Listen for 'disconnect' events
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
