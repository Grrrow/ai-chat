// Initialize Socket.IO connection
const socket = io();

// Get DOM elements
const joinContainer = document.querySelector('.join-container');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username-input');
const countrySelect = document.getElementById('country-select')
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.querySelector('.chat-input');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send-button');
const typingStatus = document.getElementById('typing-status');


messageInput.addEventListener('input', () => {
  if (messageInput.value.trim()) {
    socket.emit('user_typing');
  } else {
    socket.emit('user_stopped_typing');
  }
});

socket.on('typing_status_updated', (status) => {
  typingStatus.textContent = status;
});

fetch('http://localhost:3000/countries')
  .then((res) => res.json())
  .then((countries) => {
    // Loop through the countries object and create an option element for each country
    for (const countryCode in countries) {
      const countryName = countries[countryCode].name;

      // Create the option element and set its value and text
      const option = document.createElement("option");
      option.value = countryCode;
      option.text = countryName;

      // Add the option element to the select element
      countrySelect.add(option);
    }
  })

// Hide the join container and display the message form
joinContainer.style.display = 'flex';
chatInput.style.display = 'none';

joinContainer.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const country = countrySelect.value;

  if (!username || !country) return;

  // Emit 'join' event with username
  socket.emit('join', { username, country });

  window.sessionStorage.setItem('userCountry', country)

  // Hide the join container and display the message form
  joinContainer.style.display = 'none';
  chatInput.style.display = 'flex';
});

// Event listener for form submission
chatInput.addEventListener('submit', (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) return;

  // Emit 'send_message' event with message data
  socket.emit('send_message', message);

  // Clear input field
  messageInput.value = '';
});

// Event listener for incoming messages
socket.on('receive_message', async ({ username, country, content }) => {
  socket.emit('user_typing');
  if (window.sessionStorage.getItem('userCountry') === country) {
    const messageElement = document.createElement('p');
    messageElement.innerHTML = `<strong>${username} (${country}):</strong> ${content}`;
    return;
  }
  const response = await fetch('http://localhost:3000/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ country: window.sessionStorage.getItem('userCountry'), 'message': content })
  })
  const data = await response.json()
  const {translation} = JSON.parse(data?.choices[0]?.message?.content.trim());
  socket.emit('user_stopped_typing');
  const messageElement = document.createElement('p');
  messageElement.innerHTML = `<strong>${username} (${country}):</strong> ${translation}`;

  // Add message to list
  chatMessages.appendChild(messageElement);

  // Scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Event listener for loading stored messages
socket.on('load_messages', (messages) => {
  messages.forEach((message) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;

    // Add message to list
    chatMessages.appendChild(messageElement);
  });

  // Scroll to the latest message
  chatMessages.scrollTop = chatMessages.scrollHeight;
});
