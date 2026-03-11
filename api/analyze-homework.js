// /api/analyze-homework.js
// Analyzes Chinese character homework using Gemini API

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Validate session token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Missing or invalid authorization' 
      });
    }

    const token = authHeader.substring(7);
    
    // Validate token format (should start with session_)
    if (!token.startsWith('session_')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid session token' 
      });
    }

    // Extract timestamp from token
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token format' 
      });
    }

    const tokenTimestamp = parseInt(tokenParts[1], 10);
    if (isNaN(tokenTimestamp)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid token timestamp' 
      });
    }

    // Check if token is expired (7 days max)
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - tokenTimestamp > sevenDaysMs) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session expired' 
      });
    }

    // Get character data from request body
    const { characters } = req.body;

    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Character data is required' 
      });
    }

    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable not set');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Construct the prompt
    const characterList = characters.map(c => `${c.char} (${c.pinyin})`).join(', ');
    const prompt = `You are a friendly Chinese language tutor helping an 8-year-old girl with her homework. Be encouraging and use emojis! Keep your response under 150 words and very friendly.

The child has written these Chinese characters: ${characterList}

Character details in JSON format:
${JSON.stringify(characters, null, 2)}

Please provide:
1. Warm praise for her effort 💪
2. Pronunciation guidance for each character 🗣️
3. One helpful tip about stroke order if applicable ✍️
4. Encouragement to keep practicing 🌟
5. For each character, first give a fun english translation for the character, so that she will understand the character's basic usage.
6. If the child has written more than character, then it should be assumed that she is trying to get understanding regarding a phrase. So you should also show her 
   the usage of the whole phrase in context.

Make it fun and age-appropriate!`;

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
          topP: 0.8,
          topK: 40
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return res.status(502).json({ 
        success: false, 
        error: 'Failed to get response from AI tutor' 
      });
    }

    const geminiData = await geminiResponse.json();

    // Extract the response text
    let responseText = '';
    if (geminiData.candidates && geminiData.candidates[0] && 
        geminiData.candidates[0].content && geminiData.candidates[0].content.parts) {
      responseText = geminiData.candidates[0].content.parts[0].text || '';
    }

    if (!responseText) {
      return res.status(502).json({ 
        success: false, 
        error: 'Empty response from AI tutor' 
      });
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing homework:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
