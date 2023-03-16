const axios = require('axios');

async function translateMessage(locale, message) {
  const response = await axios({
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    data: {
      model: 'gpt-3.5-turbo',
      messages: [{'role': 'user', 'content': `Act as you're an interpreter and I'm gonna pass you a content and a locale identifier, and you have to translate the content to that locale identifier language. Return only a json format of the responses that follows this schema: translation: content translated.
  
      Content: ${message} Locale identifier: ${locale}`}]
    }
  })
  return response.data
}

module.exports = translateMessage;
