// Secure Airtable Integration
// This version is designed to work with a backend proxy to protect API keys

// Configuration for backend proxy
const API_CONFIG = {
  // Option 1: Use your own backend proxy (recommended)
  projectsEndpoint: '/api/projects', // Your backend endpoint
  
  // Option 2: Use Airtable directly (NOT recommended for production)
  // Uncomment and use only for development/testing
  // airtableDirect: {
  //   personalAccessToken: 'YOUR_PERSONAL_ACCESS_TOKEN', // ⚠️ SECURITY RISK - Never commit this!
  //   baseId: 'YOUR_BASE_ID',
  //   tableName: 'Projects'
  // }
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

// Function to fetch data securely
async function fetchProjectData() {
  try {
    let data;
    
    if (API_CONFIG.projectsEndpoint) {
      // Option 1: Use backend proxy (secure)
      const response = await fetch(API_CONFIG.projectsEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      data = await response.json();
    } else if (API_CONFIG.airtableDirect) {
      // Option 2: Direct Airtable call (NOT secure for production)
      console.warn('⚠️ SECURITY WARNING: Using direct Airtable API calls. This exposes your Personal Access Token!');
      const url = `https://api.airtable.com/v0/${API_CONFIG.airtableDirect.baseId}/${API_CONFIG.airtableDirect.tableName}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.airtableDirect.personalAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const airtableData = await response.json();
      data = airtableData.records;
    } else {
      throw new Error('No API configuration found. Please configure either projectsEndpoint or airtableDirect.');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching project data:', error);
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

// Function to transform data to GeoJSON format
function transformProjectData(projectRecords) {
  const features = [];
  const routeData = [];

  // Handle both direct Airtable format and custom backend format
  const records = projectRecords.records || projectRecords;

  records.forEach((record, index) => {
    const fields = record.fields || record; // Handle both formats
    
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
    const projectRecords = await fetchProjectData();
    const { features, routeData } = transformProjectData(projectRecords);
    
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
    
    // Load data securely and initialize map
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
