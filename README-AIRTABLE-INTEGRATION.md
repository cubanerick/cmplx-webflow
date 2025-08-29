# Airtable Integration for CMPLX MAP

This project now integrates with Airtable to dynamically load project data instead of using hardcoded locations.

## Setup Instructions

### 1. Get Your Airtable API Key

1. Go to [https://airtable.com/account](https://airtable.com/account)
2. Click on "Generate API key"
3. Give your key a name (e.g., "CMPLX MAP Integration")
4. Copy the generated API key

### 2. Get Your Base ID

1. Open your Airtable base in the browser
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. Copy the part after `/app` and before the next `/` (e.g., `XXXXXXXXXXXXXX`)

### 3. Update Configuration

#### Option A: Update the main file directly
Edit `map-airtable.js` and update these values:

```javascript
const AIRTABLE_CONFIG = {
  apiKey: 'your_actual_api_key_here',
  baseId: 'your_actual_base_id_here',
  tableName: 'Projects' // or whatever your table is named
};
```

#### Option B: Use the separate config file
1. Edit `airtable-config.js` with your credentials
2. Make sure to include it in your HTML before `map-airtable.js`:

```html
<script src="airtable-config.js"></script>
<script src="map-airtable.js"></script>
```

### 4. Airtable Table Structure

Your Airtable table should have these fields:

| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Name | Single line text | Project name | Yes |
| Start Latitude | Number | Starting latitude coordinate | Yes |
| Start Longitude | Number | Starting longitude coordinate | Yes |
| End Latitude | Number | Ending latitude coordinate | No |
| End Longitude | Number | Ending longitude coordinate | No |
| Coordinates Array | Long text | JSON array of coordinate pairs | No |

#### Coordinates Array Format

The Coordinates Array field should contain a JSON string in this format:

```json
[
  [-80.479192, 25.447817],
  [-80.482456, 25.462775],
  [-80.359644, 25.588986],
  [-80.313703, 25.685031]
]
```

**Important**: Each coordinate pair should be `[longitude, latitude]` (longitude first, then latitude).

### 5. How It Works

1. **Data Fetching**: The app fetches data from your Airtable when the map loads
2. **Coordinate Parsing**: The Coordinates Array string is parsed into JSON
3. **Point Creation**: Creates map markers for start/end coordinates
4. **Route Creation**: Creates line routes from the coordinates array
5. **Dynamic Updates**: All data is loaded dynamically from Airtable

### 6. Error Handling

The integration includes error handling for:
- Invalid API keys
- Network errors
- Malformed coordinate data
- Missing required fields

If there's an error, check the browser console for details.

### 7. Testing

1. Update your configuration with real credentials
2. Refresh the page
3. Check the browser console for any errors
4. Verify that markers and routes appear on the map

### 8. Troubleshooting

#### No data appears on the map
- Check that your API key is correct
- Verify your base ID is correct
- Ensure your table name matches exactly
- Check the browser console for error messages

#### Coordinates don't display correctly
- Verify the Coordinates Array format is valid JSON
- Ensure coordinates are in `[longitude, latitude]` order
- Check that coordinate values are valid numbers

#### API rate limits
- Airtable has rate limits (5 requests per second for free accounts)
- If you hit limits, the app will show an empty map
- Consider upgrading your Airtable plan for higher limits

### 9. Security Notes

- **Never commit API keys to version control**
- Consider using environment variables for production
- The API key gives access to your Airtable data
- Use the minimum required permissions for your API key

### 10. Customization

You can customize the integration by:
- Changing the route line color and width in the `initializeMap()` function
- Modifying the marker appearance in the `addMarkers()` function
- Adding additional fields from Airtable to the map display
- Implementing caching to reduce API calls

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Airtable credentials and table structure
3. Test with a simple coordinate array first
4. Ensure your Airtable base is accessible with the provided API key
