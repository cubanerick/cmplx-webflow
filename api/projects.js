// Vercel serverless function to proxy Airtable API calls
// This keeps your API key secure on the server side

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Airtable credentials from environment variables
    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME || 'Projects';

    // Validate required environment variables
    if (!personalAccessToken || !baseId) {
      console.error('Missing required environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Airtable Personal Access Token not configured'
      });
    }

    // Fetch data from Airtable using Personal Access Token
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}. URL: ${url}. Response: ${errorText}`);
    }

    const data = await response.json();

    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return the data
    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    
    // Set CORS headers even for errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
}
