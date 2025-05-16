// azureMapVanilla.js
// Global map variable to enable resize operations
var map;

// This function will be called by the React container after the SDK is loaded
window.initAzureMap = async function(container) {
  if (!window.atlas) {
    console.error('Azure Maps SDK not loaded');
    return;
  }

  // Get API key from window context (injected by React)
  const apiKey = window.AZURE_MAPS_KEY || '';
  
  // Fetch supply chain state (not just nodes) to get airplanes and routes
  let nodes = [], airplanes = [], routes = [];
  try {
    const res = await fetch('http://localhost:4000/api/supplychain');
    const data = await res.json();
    nodes = data.nodes || [];
    airplanes = data.airplanes || [];
    routes = data.routes || [];
    console.log('Supply chain data loaded:', nodes.length, 'nodes,', airplanes.length, 'airplanes');
  } catch (err) {
    console.error('Failed to fetch supply chain state:', err);
    // Continue with empty nodes - the map will still render
  }

  // Initialize the map with Azure Maps best practices for authentication
  map = new atlas.Map(container, {
    center: [0, 20],
    zoom: 1.5,
    view: 'Auto',
    style: 'grayscale_dark',
    authOptions: {
      authType: atlas.AuthenticationType.subscriptionKey,
      subscriptionKey: apiKey
    },
    renderOptions: {
      preserveDrawingBuffer: true,
      forcedColorSchemeAware: true
    }
  });

  map.events.add('ready', function() {
    console.log('Azure Map is ready');
    
    // Add map controls to the bottom-right
    map.controls.add([
      new atlas.control.ZoomControl({ position: 'bottom-right' }),
      new atlas.control.CompassControl({ position: 'bottom-right' }),
      new atlas.control.PitchControl({ position: 'bottom-right' }),
      new atlas.control.StyleControl({ position: 'bottom-right' }),
      new atlas.control.FullscreenControl({ position: 'bottom-right' })
    ]);
    
    // Create a data source for supply chain nodes
    var datasource = new atlas.source.DataSource();
    map.sources.add(datasource);

    // Add node features
    if (nodes.length > 0) {
      var features = nodes.map(function(node) {
        return new atlas.data.Feature(
          new atlas.data.Point([node.location.lng, node.location.lat]), 
          {
            id: node.id,
            name: node.name,
            type: node.type,
            inventory: node.inventory
          }
        );
      });
      
      datasource.add(features);
      
      // Add a symbol layer for nodes with appropriate icon based on node type
      var symbolLayer = new atlas.layer.SymbolLayer(datasource, null, {
        iconOptions: { 
          allowOverlap: true,
          image: [
            'case',
            ['==', ['get', 'type'], 'factory'], 'marker-blue',
            ['==', ['get', 'type'], 'distribution_center'], 'marker-red',
            'marker-darkblue'  // default for retail
          ]
        },
        textOptions: {
          textField: ['get', 'name'],
          offset: [0, 1.2],
          color: '#222',
          haloColor: '#fff',
          haloWidth: 1
        }
      });
      map.layers.add(symbolLayer);

      // Create popup
      var popup = new atlas.Popup({
        pixelOffset: [0, -18],
        closeButton: true
      });

      // Close popup when clicking elsewhere on the map
      map.events.add('mousemove', function() {
        popup.close();
      });

      // Show popup on hover over symbol
      map.events.add('mousemove', symbolLayer, function(e) {
        if (e.shapes && e.shapes.length > 0) {
          var shape = e.shapes[0];
          
          // Only proceed if the shape is an atlas.Shape
          if (shape instanceof atlas.Shape) {
            var props = shape.getProperties();
            var position = shape.getCoordinates();
            
            // Format inventory for display
            var inventoryHtml = '';
            if (props.inventory) {
              inventoryHtml = Object.entries(props.inventory)
                .map(function(entry) { 
                  return '<li>' + entry[0] + ': ' + entry[1] + '</li>'; 
                })
                .join('');
            }
            
            // Format node type for display
            var nodeType = props.type === 'factory' ? 'Factory' :
                          props.type === 'distribution_center' ? 'Distribution Center' :
                          props.type === 'retail' ? 'Retail' : props.type;
            
            popup.setOptions({
              content: '<div class="map-popup">' +
                        '<div class="map-popup-title">' + props.name + '</div>' +
                        '<div class="map-popup-detail">Type: ' + nodeType + '</div>' +
                        '<div class="map-popup-detail"><b>Inventory:</b></div>' +
                        '<ul class="map-popup-detail" style="margin:0;padding-left:18px">' + inventoryHtml + '</ul>' +
                      '</div>',
              position: position
            });
            
            popup.open(map);
          }
        }
      });
    } else {
      // Display a message if no nodes were loaded
      console.warn('No supply chain nodes available to display');
    }

    // === DRAW AIRPLANE ROUTES ===
    if (airplanes.length > 0 && nodes.length > 0) {
      // Create a data source for airplane routes
      var airplaneRouteSource = new atlas.source.DataSource();
      map.sources.add(airplaneRouteSource);

      airplanes.forEach(function(plane) {
        if (!plane.currentDestination) return;
        // Find the destination node
        var destNode = nodes.find(function(n) { return n.id === plane.currentDestination; });
        if (!destNode) return;
        // Use plane's current location as start
        var start = [plane.location.lng, plane.location.lat];
        var end = [destNode.location.lng, destNode.location.lat];
        // Create a LineString for the route
        var line = new atlas.data.LineString([start, end]);
        var shape = new atlas.Shape(line, {
          airplaneId: plane.id,
          from: 'airplane',
          to: destNode.id
        });
        airplaneRouteSource.add(shape);
      });

      // Add a line layer for airplane routes
      var airplaneRouteLayer = new atlas.layer.LineLayer(airplaneRouteSource, null, {
        strokeColor: '#00FFD0',
        strokeWidth: 3,
        strokeDashArray: [2, 2],
        lineJoin: 'round',
        lineCap: 'round',
        opacity: 0.85
      });
      map.layers.add(airplaneRouteLayer);
    }

    // === DRAW ALL POSSIBLE AIR ROUTES ===
    if (routes.length > 0 && nodes.length > 0) {
      // Create a data source for air routes
      var airRouteSource = new atlas.source.DataSource();
      map.sources.add(airRouteSource);

      routes.forEach(function(route) {
        if (route.mode === 'air') {
          var fromNode = nodes.find(function(n) { return n.id === route.from; });
          var toNode = nodes.find(function(n) { return n.id === route.to; });
          if (!fromNode || !toNode) return;
          var start = [fromNode.location.lng, fromNode.location.lat];
          var end = [toNode.location.lng, toNode.location.lat];
          var line = new atlas.data.LineString([start, end]);
          var shape = new atlas.Shape(line, {
            routeId: route.id,
            from: route.from,
            to: route.to
          });
          airRouteSource.add(shape);
        }
      });

      // Add a line layer for air routes (in front of airplane routes)
      var airRouteLayer = new atlas.layer.LineLayer(airRouteSource, null, {
        strokeColor: '#1E90FF', // DodgerBlue
        strokeWidth: 4,
        strokeDashArray: [1, 2],
        lineJoin: 'round',
        lineCap: 'round',
        opacity: 0.95,
        zIndex: 110 // ensure in front
      });
      map.layers.add(airRouteLayer);

      // Add arrows to indicate direction
      var arrowLayer = new atlas.layer.SymbolLayer(airRouteSource, null, {
        iconOptions: {
          image: 'arrow-forward', // built-in icon
          allowOverlap: true,
          size: 0.8,
          rotationAlignment: 'map',
          anchor: 'center',
        },
        placement: 'line',
        minZoom: 2,
        zIndex: 120
      });
      map.layers.add(arrowLayer);
    }
  });

  // Error handling
  map.events.add('error', function(e) {
    console.error('Azure Maps error:', e);
  });
};

// Add a resize handler that the React component can call when the container size changes
window.resizeMap = function() {
  if (map) {
    // Using setTimeout to ensure resize happens after DOM updates are complete
    setTimeout(function() {
      map.resize();
    }, 0);
  }
};

// Add a cleanup function to dispose of the map instance
window.destroyAzureMap = function() {
  if (map) {
    map.dispose();
    map = null;
  }
};
