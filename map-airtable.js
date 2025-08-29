// Import Airtable configuration
// Make sure to include airtable-config.js before this file in your HTML
// Or update the values directly in this file
const AIRTABLE_CONFIG = {
  apiKey: 'YOUR_AIRTABLE_API_KEY_HERE', // Replace with your actual API key
  baseId: 'YOUR_BASE_ID_HERE', // Replace with your actual base ID
  tableName: 'Projects' // Replace with your actual table name
};

mapboxgl.accessToken = 'pk.eyJ1IjoiY21wbHh3b3JsZCIsImEiOiJjbG1xcXVwOXgwMDUyMnRucG5jZjB6MTF2In0.iVeoOfjLXB2lRkxMdM8zNQ';

// Global variables for dynamic data
let stores = {
  "type": "FeatureCollection",
  "features": []
};

let routes = []; // Will store route data from Airtable

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/cmplxworld/clrb4wlg5006701ns357n1pte',
  center: [-98.5795, 39.8283], // Centered on the United States
  zoom: 4, // Adjust the zoom level as needed
});

// Function to fetch data from Airtable
async function fetchAirtableData() {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.tableName}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error('Error fetching Airtable data:', error);
    return [];
  }
}

// Function to parse coordinates string to JSON
function parseCoordinates(coordinatesString) {
  try {
    // Remove any extra whitespace and parse
    const cleanString = coordinatesString.trim();
    return JSON.parse(cleanString);
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return [];
  }
}

// Function to transform Airtable data to GeoJSON format
function transformAirtableData(airtableRecords) {
  const features = [];
  const routeData = [];

  airtableRecords.forEach((record, index) => {
    const fields = record.fields;
    
    // Parse coordinates array
    let coordinates = [];
    if (fields['Coordinates Array']) {
      coordinates = parseCoordinates(fields['Coordinates Array']);
    }

    // Create point features for start and end coordinates
    if (fields['Start Latitude'] && fields['Start Longitude']) {
      features.push({
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            parseFloat(fields['Start Longitude']),
            parseFloat(fields['Start Latitude'])
          ]
        },
        "properties": {
          "name": fields['Name'] || `project-${index}`,
          "id": index,
          "startLat": fields['Start Latitude'],
          "startLng": fields['Start Longitude'],
          "endLat": fields['End Latitude'],
          "endLng": fields['End Longitude']
        }
      });
    }

    // Create route feature if coordinates array exists
    if (coordinates.length > 0) {
      routeData.push({
        "type": "Feature",
        "properties": {
          "name": fields['Name'] || `route-${index}`,
          "id": index
        },
        "geometry": {
          "type": "LineString",
          "coordinates": coordinates
        }
      });
    }
  });

  return { features, routeData };
}

// Function to load data and initialize map
async function loadMapData() {
  try {
    const airtableRecords = await fetchAirtableData();
    const { features, routeData } = transformAirtableData(airtableRecords);
    
    // Update global variables
    stores.features = features;
    routes = routeData;

    // Add IDs to features
    stores.features.forEach(function (store, i) {
      store.properties.id = i;
    });

    // Initialize map with new data
    initializeMap();
  } catch (error) {
    console.error('Error loading map data:', error);
    // Fallback to empty map
    initializeMap();
  }
}

// Function to initialize map with data
function initializeMap() {
  // Add source for places
  map.addSource('places', {
    type: 'geojson',
    data: stores
  });

  // Add route layers dynamically
  routes.forEach((route, index) => {
    const layerId = `route-${index}`;
    
    map.addSource(layerId, {
      'type': 'geojson',
      'data': route
    });

    map.addLayer({
      id: layerId,
      type: 'line',
      source: layerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#ffbd70',
        'line-width': 4
      }
    });
  });

  // Add markers and other functionality
  addMarkers();
  buildLocations();
}

function addMarkers() {
  for (const marker of stores.features) {
    const el = document.createElement('div');
    el.id = `marker-${marker.properties.id}`;
    el.className = 'marker';
    new mapboxgl.Marker(el, { offset: [0, 0] })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);
    el.addEventListener('click', (e) => {
      console.log(marker.properties.name);
      document.querySelectorAll('.marker').forEach(e => {
        e.style.backgroundImage = null;
      });
      el.style.backgroundImage = 'url("https://uploads-ssl.webflow.com/64ee47c85867e1223ad76904/65788ee8bc90be6938707328_Active%20Pin.png")';
      document.querySelectorAll('.collection-item-2').forEach(e => {
        if(e.getAttribute('data-item') === marker.properties.name){
          e.style.display = 'block';
        }
      })
      createPopUp(marker);
    });
  }
}

function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 9
  });
}

function createPopUp(currentFeature) {
  const popUps = document.getElementsByClassName('mapboxgl-popup');
  if (popUps[0]) popUps[0].remove();
  const popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat(currentFeature.geometry.coordinates)
    .addTo(map);
}

let buildLocations = () => {
	const items = document.querySelectorAll('.item');
  items.forEach(e => {
  	let name = e.children[0].children[0].children[0].children[0].innerHTML;
  	let obj = stores.features.find(o => o.properties.name === name);
    let link = e.children[0].children[0].children[0];
    let distanceText = e.children[0].children[0].children[1];
    
  	e.id = `listing-${obj.properties.id}`;
    link.id = `link-${obj.properties.id}`;

    if (obj.properties.distance) {
        const roundedDistance = Math.round(obj.properties.distance * 100) / 100;
        distanceText.innerHTML = `${roundedDistance} MILES AWAY`;
        e.setAttribute('distance', roundedDistance);
    }
    link.addEventListener('click', function () {
      for (const feature of stores.features) {
        if (this.id === `link-${feature.properties.id}`) {
          flyToStore(feature);
          createPopUp(feature);
        }
      }
      const activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.parentNode.classList.add('active');
    });
  });
};

map.on('load', () => {
  setTimeout(function() {
    map.flyTo({
      center: [-81.5158, 27.7663], // Centered on Florida
      zoom: 6, // Zoom level for Florida
      speed: 0.5,
    });
  }, 2000);
  
  const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true,
      bbox: [-124.848974, 24.396308, -66.885444, 49.384358]
  });
	map.addControl(geocoder, 'top-left');
    
    map.on('click', (event) => {
      // Click event handling
    });
    
    // Load data from Airtable and initialize map
    loadMapData();
    
    geocoder.on('result', (event) => {
        const searchResult = event.result.geometry;
        const options = { units: 'miles' };
        for (const store of stores.features) {
          store.properties.distance = turf.distance(
            searchResult,
            store.geometry,
            options
          );
        }
        buildLocations();
        var list = document.querySelector('.listings');
        var items = Array.from(list.childNodes);

        items.sort(function(a, b) {
            return parseFloat(a.children[0].children[0].children[1].innerHTML.split(' ')[0]) - parseFloat(b.children[0].children[0].children[1].innerHTML.split(' ')[0])
        });

        document.querySelector('.listings').innerHTML = '';

        for (i = 0; i < items.length; ++i) {
            list.appendChild(items[i]);
        }
        buildLocations();
        const activeListing = document.getElementById(
            `listing-${stores.features[0].properties.id}`
        );
        activeListing.classList.add('active');
    });
});