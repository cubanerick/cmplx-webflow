// List all tables in your Airtable base
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!personalAccessToken || !baseId) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        message: 'Personal Access Token or Base ID not configured'
      });
    }

    // First, try to get base metadata to see available tables
    const baseUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
    
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tables: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return table information
    res.status(200).json({
      message: 'Available tables in your base',
      baseId: baseId,
      tables: data.tables.map(table => ({
        id: table.id,
        name: table.name,
        description: table.description || 'No description'
      })),
      totalTables: data.tables.length
    });

  } catch (error) {
    console.error('Error listing tables:', error);
    
    // Set CORS headers even for errors
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(500).json({ 
      error: 'Failed to list tables',
      message: error.message,
      suggestion: 'Check if your Personal Access Token has access to base metadata'
    });
  }
}
