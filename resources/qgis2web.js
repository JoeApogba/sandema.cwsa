
isTracking = false;
var Lat, Long; // Variables to store latitude and longitude

var geolocateControl = (function (Control) {
    geolocateControl = function(opt_options) {
        var options = opt_options || {};
        var button = document.createElement('button');
        button.className = 'fa fa-map-marker';
        var handleGeolocate = function() {
            if (isTracking) {
                map.removeLayer(geolocateOverlay);
                isTracking = false;
                Lat = null; // Clear the previous value
                Long = null; // Clear the previous value
                updateCoordinates(null, null); // Update the display with null values
            } else if (geolocation.getTracking()) {
                map.addLayer(geolocateOverlay);
                map.getView().setCenter(geolocation.getPosition());
                isTracking = true;
                var position = geolocation.getPosition();
                Lat = position[1]; // Latitude
                Long = position[0]; // Longitude
                updateCoordinates(Lat, Long); // Update the display with the new values
            }
        };
        button.addEventListener('click', handleGeolocate, false);
        button.addEventListener('touchstart', handleGeolocate, false);
        var displayElement = document.createElement('div'); // Element to display the latitude and longitude
        displayElement.className = 'geolocate-display';
        
        // Function to update the display with latitude and longitude values
        function updateCoordinates(latitude, longitude) {
            if (latitude !== null && longitude !== null) {
                displayElement.innerHTML = 'Latitude: ' + latitude.toFixed(6) + '°<br>Longitude: ' + longitude.toFixed(6) + '°'; // Display the values
            } else {
                displayElement.innerHTML = ''; // Clear the display
            }
        }
        
        var element = document.createElement('div');
        element.className = 'geolocate ol-unselectable ol-control';
        element.appendChild(button);
        element.appendChild(displayElement); // Append the display element
        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    };
    if (Control) geolocateControl.__proto__ = Control;
    geolocateControl.prototype = Object.create(Control && Control.prototype);
    geolocateControl.prototype.constructor = geolocateControl;
    return geolocateControl;
}(ol.control.Control));


// Function to create the estimate button dynamically
function createEstimateButton() {
    const estimateButton = document.createElement('button');
    estimateButton.innerText = 'Estimate';
  
    estimateButton.className = 'measure-button';
  
    // Add event listener to the button
    estimateButton.addEventListener('click', measureDistance);
  
    const container = document.getElementById('map');
    container.appendChild(estimateButton);
  }
  
  function measureDistance() {
    console.log('Button clicked'); // Check if the button click event is triggered
  
    // Retrieve user's current location (latitude and longitude)
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  
    function successCallback(position) {
      const userLatitude = position.coords.latitude;
      const userLongitude = position.coords.longitude;
  
      console.log('Location:', userLatitude, userLongitude); // Check if user's location is retrieved
  
      // Fetch the pipeline data from a GeoJSON file
	  fetch('layers/Pipes.geojson')
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not OK');
			}
			return response.json();
		})
		.then(data => {
			console.log('Pipeline data:', data); // Check if pipeline data is fetched

		// Extract the pipeline segments from the GeoJSON data
		const pipelineSegments = data.features.map(feature => feature.geometry.coordinates);

		console.log('Pipeline segments:', pipelineSegments); // Check if pipeline segments are extracted

  
          // Calculate distance from user's location to each pipeline segment
          const distances = pipelineSegments.map(pipelineSegment => {
            const pipelineStart = pipelineSegment[0];
            const pipelineEnd = pipelineSegment[pipelineSegment.length - 1];
  
            const distance = calculateDistanceToLineSegment(
              userLatitude, userLongitude, pipelineStart, pipelineEnd
            );
  
            return distance;
          });
  
          console.log('Distances:', distances); // Check the calculated distances
  
          const minDistance = Math.min(...distances); // Calculate the minimum distance
  
          console.log('Minimum distance:', minDistance); // Check the minimum distance
  
          const distanceDisplay = document.createElement('div');
          distanceDisplay.id = 'distance-display';
          distanceDisplay.innerText = ` ${minDistance} meters`;
  
          const container = document.getElementById('map');
          container.appendChild(distanceDisplay);
        })
        .catch(error => {
          // Handle error while fetching or parsing pipeline data
          console.error('Error occurred while fetching pipeline data:', error);
        });
    }
  
    function errorCallback(error) {
      // Handle error when retrieving user's location
      console.error('Error occurred while retrieving user location:', error);
    }
  }
  
  // Call the createEstimateButton function to create the button
  createEstimateButton();
  
	 function calculateDistanceToLineSegment(userLatitude, userLongitude, pipelineStart, pipelineEnd) {
	  // Convert latitude and longitude to radians
	  const lat1 = userLatitude * Math.PI / 180;
	  const lon1 = userLongitude * Math.PI / 180;
	  const lat2 = pipelineStart[1] * Math.PI / 180;
	  const lon2 = pipelineStart[0] * Math.PI / 180;
	  const lat3 = pipelineEnd[1] * Math.PI / 180;
	  const lon3 = pipelineEnd[0] * Math.PI / 180;

	  // Calculate the distance using the Haversine formula
	  const dLat = lat3 - lat2;
	  const dLon = lon3 - lon2;
	  const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat2) * Math.cos(lat3) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	  const distance = 6371000 * c; // Radius of the Earth in meters

	  return distance;
	}

  


var measuring = false;
var draw; // The draw interaction
var helpTooltip; // The help tooltip element
var measureTooltip; // The measure tooltip element
var clearButton; // The clear button element

var measureControl = (function (Control) {
    // Constructor function for the measure control
    measureControl = function(opt_options) {
        // Extracting options object or assigning an empty object if not provided
        var options = opt_options || {};

        // Creating a button element with '<fas fa-ruler' class
        var button = document.createElement('button');
        button.className += ' fas fa-ruler';

        // Creating a clear button element with 'fas fa-trash' class
        clearButton = document.createElement('button');
        clearButton.className += ' fas fa-trash';
        clearButton.style.display = 'none'; // Hide the clear button initially

        // Storing the reference to the measure control object
        var this_ = this;

        // Event handler function for the button click or touchstart event
        var handleMeasure = function(e) {
            if (!measuring) {
                // Adding interaction 'draw' to the map
                this_.getMap().addInteraction(draw);
                createHelpTooltip();
                createMeasureTooltip();
                measuring = true;
                clearButton.style.display = ''; // Show the clear button
            } else {
                // Removing the 'draw' interaction from the map
                this_.getMap().removeInteraction(draw);
                measuring = false;
                this_.getMap().removeOverlay(helpTooltip);
                this_.getMap().removeOverlay(measureTooltip);
                clearButton.style.display = 'none'; // Hide the clear button
                clearMeasurements(); // Clear the drawn measurements
            }
        };

        // Event handler function for the clear button click event
		var handleClear = function(e) {
			source.clear(); // Clear the vector source
			clearMeasureTooltip(); // Clear the measure tooltip
			clearButton.style.display = 'none'; // Hide the clear button
			};


        // Adding event listeners for the button click and touchstart events
        button.addEventListener('click', handleMeasure, false);
        button.addEventListener('touchstart', handleMeasure, false);
        clearButton.addEventListener('click', handleClear, false);

        // Creating a container element for the control
        var element = document.createElement('div');
        element.className = 'measure-control ol-unselectable ol-control';
        element.appendChild(button);
        element.appendChild(clearButton);

        // Calling the parent control constructor with the provided options
        ol.control.Control.call(this, {
            element: element,
            target: options.target
        });
    };

    // Inheriting the Control prototype
    if (Control) measureControl.__proto__ = Control;
    measureControl.prototype = Object.create(Control && Control.prototype);
    measureControl.prototype.constructor = measureControl;

    // Returning the measure control function
    return measureControl;
}(ol.control.Control));


// Create the draw interaction with meters as the unit
draw = new ol.interaction.Draw({
    source: source,
    type: 'LineString', // or 'Polygon' or other geometry type
    // Modify the geometry function to use meters
    geometryFunction: ol.interaction.Draw.createBox(),
    // Modify the style if needed
    style: new ol.style.Style({
        // ...
    })
});

// Create the measure tooltip
function createMeasureTooltip() {
    // ...
    // Modify the line that sets the tooltip text
    measureTooltipElement.innerHTML = measurement.toFixed(2) + ' meters'; // Change the precision and the unit
    // ...
}

// Function to clear the drawn measurements and tooltips
function clearMeasurements() {
    source.clear(); // Remove all features from the source
    this.getOverlay().setPosition(undefined); // Clear the measure tooltip position

    // Remove existing tooltips from the map
    var overlays = this.getMap().getOverlays();
    overlays.forEach(function(overlay) {
        this.getMap().removeOverlay(overlay);
    }, this);
}



var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var sketch;

closer.onclick = function() {
    container.style.display = 'none';
    closer.blur();
    return false;
};
var overlayPopup = new ol.Overlay({
    element: container
});

var expandedAttribution = new ol.control.Attribution({
    collapsible: false
});

var map = new ol.Map({
    controls: ol.control.defaults({attribution:false}).extend([
        expandedAttribution,new measureControl(),new geolocateControl()
    ]),
    target: document.getElementById('map'),
    renderer: 'canvas',
    overlays: [overlayPopup],
    layers: layersList,
    view: new ol.View({
         maxZoom: 28, minZoom: 1
    })
});

var layerSwitcher = new ol.control.LayerSwitcher({tipLabel: "Layers"});
map.addControl(layerSwitcher);

map.getView().fit([-145884.796729, 1200281.411237, -140286.393703, 1203281.008711], map.getSize());

var NO_POPUP = 0
var ALL_FIELDS = 1

/**
 * Returns either NO_POPUP, ALL_FIELDS or the name of a single field to use for
 * a given layer
 * @param layerList {Array} List of ol.Layer instances
 * @param layer {ol.Layer} Layer to find field info about
 */
function getPopupFields(layerList, layer) {
    // Determine the index that the layer will have in the popupLayers Array,
    // if the layersList contains more items than popupLayers then we need to
    // adjust the index to take into account the base maps group
    var idx = layersList.indexOf(layer) - (layersList.length - popupLayers.length);
    return popupLayers[idx];
}


var collection = new ol.Collection();
var featureOverlay = new ol.layer.Vector({
    map: map,
    source: new ol.source.Vector({
        features: collection,
        useSpatialIndex: false // optional, might improve performance
    }),
    style: [new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#f00',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,0,0,0.1)'
        }),
    })],
    updateWhileAnimating: true, // optional, for instant visual feedback
    updateWhileInteracting: true // optional, for instant visual feedback
});

var doHighlight = true;
var doHover = true;

var highlight;
var autolinker = new Autolinker({truncate: {length: 30, location: 'smart'}});
var onPointerMove = function(evt) {
    if (!doHover && !doHighlight) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var currentFeature;
    var currentLayer;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        // We only care about features from layers in the layersList, ignore
        // any other layers which the map might contain such as the vector
        // layer used by the measure tool
        if (layersList.indexOf(layer) === -1) {
            return;
        }
        var doPopup = false;
        for (k in layer.get('fieldImages')) {
            if (layer.get('fieldImages')[k] != "Hidden") {
                doPopup = true;
            }
        }
        currentFeature = feature;
        currentLayer = layer;
        clusteredFeatures = feature.get("features");
        var clusterFeature;
        if (typeof clusteredFeatures !== "undefined") {
            if (doPopup) {
                for(var n=0; n<clusteredFeatures.length; n++) {
                    clusterFeature = clusteredFeatures[n];
                    currentFeatureKeys = clusterFeature.getKeys();
                    popupText += '<li><table>'
                    for (var i=0; i<currentFeatureKeys.length; i++) {
                        if (currentFeatureKeys[i] != 'geometry') {
                            popupField = '';
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                            popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                            } else {
                                popupField += '<td colspan="2">';
                            }
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                            }
                            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(clusterFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                            } else {
                                popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                            }
                            popupText += '<tr>' + popupField + '</tr>';
                        }
                    } 
                    popupText += '</table></li>';    
                }
            }
        } else {
            currentFeatureKeys = currentFeature.getKeys();
            if (doPopup) {
                popupText += '<li><table>';
                for (var i=0; i<currentFeatureKeys.length; i++) {
                    if (currentFeatureKeys[i] != 'geometry') {
                        popupField = '';
                        if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                            popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                        } else {
                            popupField += '<td colspan="2">';
                        }
                        if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                            popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                        }
                        if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                            popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                        } else {
                            popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                        }
                        popupText += '<tr>' + popupField + '</tr>';
                    }
                }
                popupText += '</table></li>';
            }
        }
    });
    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }

    if (doHighlight) {
        if (currentFeature !== highlight) {
            if (highlight) {
                featureOverlay.getSource().removeFeature(highlight);
            }
            if (currentFeature) {
                var styleDefinition = currentLayer.getStyle().toString();

                if (currentFeature.getGeometry().getType() == 'Point') {
                    var radius = styleDefinition.split('radius')[1].split(' ')[1];

                    highlightStyle = new ol.style.Style({
                        image: new ol.style.Circle({
                            fill: new ol.style.Fill({
                                color: "#ffff00"
                            }),
                            radius: radius
                        })
                    })
                } else if (currentFeature.getGeometry().getType() == 'LineString') {

                    var featureWidth = styleDefinition.split('width')[1].split(' ')[1].replace('})','');

                    highlightStyle = new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#ffff00',
                            lineDash: null,
                            width: featureWidth
                        })
                    });

                } else {
                    highlightStyle = new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: '#ffff00'
                        })
                    })
                }
                featureOverlay.getSource().addFeature(currentFeature);
                featureOverlay.setStyle(highlightStyle);
            }
            highlight = currentFeature;
        }
    }

    if (doHover) {
        if (popupText) {
            overlayPopup.setPosition(coord);
            content.innerHTML = popupText;
            container.style.display = 'block';        
        } else {
            container.style.display = 'none';
            closer.blur();
        }
    }
};

var onSingleClick = function(evt) {
    if (doHover) {
        return;
    }
    if (sketch) {
        return;
    }
    var pixel = map.getEventPixel(evt.originalEvent);
    var coord = evt.coordinate;
    var popupField;
    var currentFeature;
    var currentFeatureKeys;
    var clusteredFeatures;
    var popupText = '<ul>';
    map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        if (feature instanceof ol.Feature && (layer.get("interactive") || layer.get("interactive") == undefined)) {
            var doPopup = false;
            for (k in layer.get('fieldImages')) {
                if (layer.get('fieldImages')[k] != "Hidden") {
                    doPopup = true;
                }
            }
            currentFeature = feature;
            clusteredFeatures = feature.get("features");
            var clusterFeature;
            if (typeof clusteredFeatures !== "undefined") {
                if (doPopup) {
                    for(var n=0; n<clusteredFeatures.length; n++) {
                        clusterFeature = clusteredFeatures[n];
                        currentFeatureKeys = clusterFeature.getKeys();
                        popupText += '<li><table>'
                        for (var i=0; i<currentFeatureKeys.length; i++) {
                            if (currentFeatureKeys[i] != 'geometry') {
                                popupField = '';
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                                } else {
                                    popupField += '<td colspan="2">';
                                }
                                if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                    popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                                }
                                if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(clusterFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                                } else {
                                    popupField += (clusterFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + clusterFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                                }
                                popupText += '<tr>' + popupField + '</tr>';
                            }
                        } 
                        popupText += '</table></li>';    
                    }
                }
            } else {
                currentFeatureKeys = currentFeature.getKeys();
                if (doPopup) {
                    popupText += '<li><table>';
                    for (var i=0; i<currentFeatureKeys.length; i++) {
                        if (currentFeatureKeys[i] != 'geometry') {
                            popupField = '';
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "inline label") {
                                popupField += '<th>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</th><td>';
                            } else {
                                popupField += '<td colspan="2">';
                            }
                            if (layer.get('fieldLabels')[currentFeatureKeys[i]] == "header label") {
                                popupField += '<strong>' + layer.get('fieldAliases')[currentFeatureKeys[i]] + ':</strong><br />';
                            }
                            if (layer.get('fieldImages')[currentFeatureKeys[i]] != "ExternalResource") {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? autolinker.link(currentFeature.get(currentFeatureKeys[i]).toLocaleString()) + '</td>' : '');
                            } else {
                                popupField += (currentFeature.get(currentFeatureKeys[i]) != null ? '<img src="images/' + currentFeature.get(currentFeatureKeys[i]).replace(/[\\\/:]/g, '_').trim()  + '" /></td>' : '');
                            }
                            popupText += '<tr>' + popupField + '</tr>';
                        }
                    }
                    popupText += '</table>';
                }
            }
        }
    });
    if (popupText == '<ul>') {
        popupText = '';
    } else {
        popupText += '</ul>';
    }
    
    var viewProjection = map.getView().getProjection();
    var viewResolution = map.getView().getResolution();
    for (i = 0; i < wms_layers.length; i++) {
        if (wms_layers[i][1]) {
            var url = wms_layers[i][0].getSource().getGetFeatureInfoUrl(
                evt.coordinate, viewResolution, viewProjection,
                {
                    'INFO_FORMAT': 'text/html',
                });
            if (url) {
                popupText = popupText + '<iframe style="width:100%;height:110px;border:0px;" id="iframe" seamless src="' + url + '"></iframe>';
            }
        }
    }

    if (popupText) {
        overlayPopup.setPosition(coord);
        content.innerHTML = popupText;
        container.style.display = 'block';        
    } else {
        container.style.display = 'none';
        closer.blur();
    }
};


    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        if (measuring) {
            /** @type {string} */
            var helpMsg = 'Click to start drawing';
            if (sketch) {
                var geom = (sketch.getGeometry());
                if (geom instanceof ol.geom.Polygon) {
                    helpMsg = continuePolygonMsg;
                } else if (geom instanceof ol.geom.LineString) {
                    helpMsg = continueLineMsg;
                }
            }
            helpTooltipElement.innerHTML = helpMsg;
            helpTooltip.setPosition(evt.coordinate);
        }
    });
    

map.on('pointermove', function(evt) {
    onPointerMove(evt);
});
map.on('singleclick', function(evt) {
    onSingleClick(evt);
});

/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */

/**
 * The help tooltip element.
 * @type {Element}
 */
var helpTooltipElement;


/**
 * Overlay to show the help messages.
 * @type {ol.Overlay}
 */
var helpTooltip;


/**
 * The measure tooltip element.
 * @type {Element}
 */
var measureTooltipElement;


/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measureTooltip;


/**
 * Message to show when the user is drawing a line.
 * @type {string}
 */
var continueLineMsg = 'Click to continue drawing the line';






var source = new ol.source.Vector();

var measureLayer = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
            color: '#ffcc33',
            width: 3
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#ffcc33'
            })
        })
    })
});

map.addLayer(measureLayer);

var draw; // global so we can remove it later
function addInteraction() {
  var type = 'LineString';
  draw = new ol.interaction.Draw({
    source: source,
    type: /** @type {ol.geom.GeometryType} */ (type),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });

  var listener;
  draw.on('drawstart',
      function(evt) {
        // set sketch
        sketch = evt.feature;

        /** @type {ol.Coordinate|undefined} */
        var tooltipCoord = evt.coordinate;

        listener = sketch.getGeometry().on('change', function(evt) {
          var geom = evt.target;
          var output;
            output = formatLength( /** @type {ol.geom.LineString} */ (geom));
            tooltipCoord = geom.getLastCoordinate();
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

  draw.on('drawend',
      function(evt) {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);
        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip();
        ol.Observable.unByKey(listener);
      }, this);
}


/**
 * Creates a new help tooltip
 */
function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }
  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'tooltip hidden';
  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });
  map.addOverlay(helpTooltip);
}


/**
 * Creates a new measure tooltip
 */
function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }
  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'tooltip tooltip-measure';
  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });
  map.addOverlay(measureTooltip);
}



/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function(line) {
  var length;
  var coordinates = line.getCoordinates();
  length = 0;
  var sourceProj = map.getView().getProjection();
  for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
      var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
      length += ol.sphere.getDistance(c1, c2);
    }
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};

addInteraction();


      var geolocation = new ol.Geolocation({
  projection: map.getView().getProjection()
});


var accuracyFeature = new ol.Feature();
geolocation.on('change:accuracyGeometry', function() {
  accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
});

var positionFeature = new ol.Feature();
positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
      new ol.geom.Point(coordinates) : null);
});

var geolocateOverlay = new ol.layer.Vector({
  source: new ol.source.Vector({
    features: [accuracyFeature, positionFeature]
  })
});

geolocation.setTracking(true);


var geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  lang: 'en-US',
  placeholder: 'Search for ...',
  limit: 5,
  keepOpen: true
});
map.addControl(geocoder);

document.getElementsByClassName('gcd-gl-btn')[0].className += ' fa fa-search';

var attributionComplete = false;
map.on("rendercomplete", function(evt) {
    if (!attributionComplete) {
        var attribution = document.getElementsByClassName('ol-attribution')[0];
        var attributionList = attribution.getElementsByTagName('ul')[0];
        var firstLayerAttribution = attributionList.getElementsByTagName('li')[0];
        var qgis2webAttribution = document.createElement('li');
        qgis2webAttribution.innerHTML = '<a href="https://github.com/tomchadwin/qgis2web"></a>';
        var olAttribution = document.createElement('li');
        olAttribution.innerHTML = '<a href="https://openlayers.org/">OpenLayers</a>';
        var qgisAttribution = document.createElement('li');
        qgisAttribution.innerHTML = '<a href="https://qgis.org/"></a>';
        attributionList.insertBefore(qgis2webAttribution, firstLayerAttribution);
        attributionList.insertBefore(olAttribution, firstLayerAttribution);
        attributionList.insertBefore(qgisAttribution, firstLayerAttribution);
        attributionComplete = true;
    }
})
