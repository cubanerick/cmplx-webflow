// Debug endpoint to help troubleshoot Airtable connection
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const personalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return debug information
    res.status(200).json({
      message: 'Debug information',
      environment: {
        hasPersonalAccessToken: !!personalAccessToken,
        hasBaseId: !!baseId,
        hasTableName: !!tableName,
        tableName: tableName,
        baseId: baseId,
        personalAccessTokenLength: personalAccessToken ? personalAccessToken.length : 0
      },
      testUrls: {
        baseUrl: `https://api.airtable.com/v0/${baseId}`,
        tableUrl: `https://api.airtable.com/v0/${baseId}/${tableName}`,
        baseUrlEncoded: `https://api.airtable.com/v0/${encodeURIComponent(baseId)}`,
        tableUrlEncoded: `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableName)}`
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ 
      error: 'Debug failed',
      message: error.message 
    });
  }
}
