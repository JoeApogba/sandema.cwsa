var wms_layers = [];


        var lyr_GoogleSatelliteHybrid_0 = new ol.layer.Tile({
            'title': 'Google Satellite Hybrid',
            'type': 'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
    attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
        });

        var lyr_GoogleMaps_1 = new ol.layer.Tile({
            'title': 'Google Maps',
            'type': 'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
    attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            })
        });

        var lyr_OpenStreetMap_2 = new ol.layer.Tile({
            'title': 'Open Street Map',
            'type': 'base',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
    attributions: ' &middot; <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors, CC-BY-SA</a>',
                url: 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'
            })
        });
var format_Pipes_3 = new ol.format.GeoJSON();
var features_Pipes_3 = format_Pipes_3.readFeatures(json_Pipes_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_Pipes_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_Pipes_3.addFeatures(features_Pipes_3);
var lyr_Pipes_3 = new ol.layer.Vector({
                declutter: true,
                source:jsonSource_Pipes_3,
maxResolution:28004.466152261964,
 
                style: style_Pipes_3,
                interactive: true,
                title: '<img src="styles/legend/Pipes_3.png" /> Pipes'
            });

lyr_GoogleSatelliteHybrid_0.setVisible(true);lyr_GoogleMaps_1.setVisible(true);lyr_OpenStreetMap_2.setVisible(true);lyr_Pipes_3.setVisible(true);
var layersList = [lyr_GoogleSatelliteHybrid_0,lyr_GoogleMaps_1,lyr_OpenStreetMap_2,lyr_Pipes_3];
lyr_Pipes_3.set('fieldAliases', {'OBJECTID': 'OBJECTID', 'Length2': 'Length2', 'Material': 'Material', 'Pressure': 'Pressure', 'Label': 'Label', 'GlobalID': 'GlobalID', 'Diameter': 'Diameter', 'Type': 'Type', 'Shape_Leng': 'Shape_Leng', });
lyr_Pipes_3.set('fieldImages', {'OBJECTID': 'TextEdit', 'Length2': 'TextEdit', 'Material': 'TextEdit', 'Pressure': 'TextEdit', 'Label': 'TextEdit', 'GlobalID': 'TextEdit', 'Diameter': 'TextEdit', 'Type': 'TextEdit', 'Shape_Leng': 'TextEdit', });
lyr_Pipes_3.set('fieldLabels', {'OBJECTID': 'no label', 'Length2': 'no label', 'Material': 'header label', 'Pressure': 'no label', 'Label': 'no label', 'GlobalID': 'no label', 'Diameter': 'inline label', 'Type': 'no label', 'Shape_Leng': 'no label', });
lyr_Pipes_3.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});