// /api/validate-password.js
// Validates family password and returns session token

const SESSION_DURATION_DAYS = 7;

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { password, rememberMe } = req.body;

    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Password is required' 
      });
    }

    // Get expected password from environment variable
    const expectedPassword = process.env.FAMILY_PASSWORD;

    if (!expectedPassword) {
      console.error('FAMILY_PASSWORD environment variable not set');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Validate password
    if (password !== expectedPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }

    // Generate session token (simple timestamp + random string)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const token = `session_${timestamp}_${randomString}`;

    // Calculate expiration
    const expirationDays = rememberMe ? SESSION_DURATION_DAYS : 1;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // Return success with token and expiration
    return res.status(200).json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      duration: expirationDays
    });

  } catch (error) {
    console.error('Error validating password:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
