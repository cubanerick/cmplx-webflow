// Airtable Configuration
// Update these values with your actual Airtable details

const AIRTABLE_CONFIG = {
  // Your Airtable API Key
  // Get this from: https://airtable.com/account
  apiKey: 'YOUR_AIRTABLE_API_KEY_HERE',
  
  // Your Base ID (found in the URL when viewing your base)
  // Example: https://airtable.com/appXXXXXXXXXXXXXX/... -> appXXXXXXXXXXXXXX
  baseId: 'YOUR_BASE_ID_HERE',
  
  // Your table name (exactly as it appears in Airtable)
  tableName: 'Projects'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIRTABLE_CONFIG;
}
