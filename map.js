mapboxgl.accessToken = 'pk.eyJ1IjoiY3ViYW5lcmljayIsImEiOiJjbGp3N29jaWowcDZwM2ZxZnRsMHR6NHRoIn0.xVatmWjPQ2IxG9z_kdZNtg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/cubanerick/cln9cpawf07ef01qi0lcmhuko',
    // center: [-81.5158, 27.6648],
    // zoom: 6,
    center: [-98.5795, 39.8283], // Centered on the United States
    zoom: 4, // Adjust the zoom level as needed
  });
  const stores = {
    "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.319055,
          25.9110939
        ]
      },
      "properties": {
        "name": "north-corridor",
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -80.3377317,
          25.7987151
        ]
      },
      "properties": {
        "name": "south-corridor",
      }
    }
  ]
}
function addMarkers() {
  for (const marker of stores.features) {
    const el = document.createElement('div');
    el.id = `marker-${marker.properties.id}`;
    el.className = 'marker';
    new mapboxgl.Marker(el, { offset: [0, -23] })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);
    el.addEventListener('click', (e) => {
      console.log(marker.properties.name);
      document.querySelectorAll('.collection-item-2').forEach(e => {
        if(e.getAttribute('data-item') === marker.properties.name){
          e.style.display = 'block';
        }
      })
      // flyToStore(marker);
      createPopUp(marker);
      // const activeItem = document.getElementsByClassName('active');
      // e.stopPropagation();
      // if (activeItem[0]) {
      //   activeItem[0].classList.remove('active');
      // }
      // const listing = document.getElementById(`listing-${marker.properties.id}`);
      // listing.classList.add('active');
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
    // .setHTML(`<h4>${currentFeature.properties.name}</h4><h4>${currentFeature.properties.address}</h4>`)
    .addTo(map);
}
stores.features.forEach(function (store, i) {
  store.properties.id = i;
});

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
    });
  }, 2000);
  map.addSource('places', {
    type: 'geojson',
    data: stores
  });
  const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: true,
      bbox: [-124.848974, 24.396308, -66.885444, 49.384358]
  });
	map.addControl(geocoder, 'top-left');
    addMarkers();
    map.on('click', (event) => {
      // const features = map.queryRenderedFeatures(event.point, {
      //   layers: ['locations']
      // });
      // if (!features.length) return;
      // const clickedPoint = features[0];
      // flyToStore(clickedPoint);
      // createPopUp(clickedPoint);
      // const activeItem = document.getElementsByClassName('active');
      // if (activeItem[0]) {
      //   activeItem[0].classList.remove('active');
      // }
      // const listing = document.getElementById(
      //   `listing-${clickedPoint.properties.id}`
      // );
      // listing.classList.add('active');
    });
    buildLocations();
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