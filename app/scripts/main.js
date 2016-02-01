/*jslint browser: true*/
/*global L */


L.Icon.Default.imagePath = 'images/';

/* create leaflet map */
var map = L.map('map', {
    center: [1.31, 103.8],
    zoom: 11
});

var buildings = new L.geoJson().addTo(map);



var district_boundary = new L.geoJson();
district_boundary.addTo(map);

// $.get("/geojson", function(data, status){
//         district_boundary.addData(data);
//     }).error(function(err) {console.log(err)});



var myLines = [{
    "type": "LineString",
    "coordinates": [
        [-100, 40],
        [-105, 45],
        [-110, 55]
    ]
}, {
    "type": "LineString",
    "coordinates": [
        [-105, 40],
        [-110, 45],
        [-115, 55]
    ]
}];

var myLayer = L.geoJson().addTo(map);
myLayer.addData(myLines);
/* add default stamen tile layer */
new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 18,
    attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
}).addTo(map);






function handleFeature(feature, layer) {
    layer.on({
        mouseover: mouseoverfunction,
        mouseout: mouseoutfunction
    });
}

function mouseoverfunction(e) {
    var properties = e.target.feature.properties;
    for (var prop in properties) {
        if (properties.hasOwnProperty(prop)) {
            // or if (Object.prototype.hasOwnProperty.call(obj,prop)) for safety...
            console.log("prop: " + prop + " value: " + properties[prop]);
            document.getElementById("properties").innerHTML = document.getElementById("properties").innerHTML + "<tr><td>" + prop + "</td><td>" + properties[prop] + "</td></tr>";
        }
    }
}

function mouseoutfunction(e) {
    document.getElementById("properties").innerHTML = "";
}

// omnivore.kml('data/AQUATICSG.kml').addTo(map);
// omnivore.geojson('geojson/buildings.json').addTo(map);

// $.get("/geojson", function(data, status) {
//     L.geoJson(data,{
//         onEachFeature: handleFeature
//     }).addTo(map);

//     // omnivore.geojson(data, { onEachFeature: handleFeature}).addTo(map);


//     // console.log(data);

// }).error(function(err) {
//     console.log(err);
// });

$(document).ready(function() {
    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties) {
            var popupContent = "";
            console.log("a");
            for (var propertyname in feature.properties){
                // console.log(feature.properties[propertyname]);
                popupContent += "<b>" + propertyname + "</b>" + ": " + feature.properties[propertyname].toString() + "</br>";
            }
            layer.bindPopup(popupContent);
        }
    }
    var layerFiles = [];

    $('#files').change(function(evt) {
        var files = evt.target.files;

        for (var i = 0; i < files.length; i++) {
            file = files.item(i);
            fileExtension = file["name"].substr(file["name"].lastIndexOf('.') + 1);
    
            if (fileExtension === "csv") {
                
                Papa.parse(file, {
                    download: true,
                    header: true,   
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        var leafletFeatures = []; //array of leaflet feature objects
                        fields = results["data"];

                        fields.forEach(function(field) {

                            var leafletFeature = new Object(); //single leaflet object
                            leafletFeature["type"] = "Feature";
                            leafletFeature["properties"] = field;
                            console.log(leafletFeature);
                            var postcode = field["POSTCODE"].toString();
                            var localApi = '/getPostalCode/' + postcode;

                            $.get(localApi, function(geocodedData, status) {
                                var geocodedDataJson = JSON.parse(geocodedData); //response from geocoding API
                                searchResults = geocodedDataJson["SearchResults"]; //array containing response of geocoding API
                                
                                if (searchResults[0].hasOwnProperty("ErrorMessage") === false) {
                                    if (searchResults.length > 1) {
                                        var geoObj = {};
                                        geoObj["type"] = "Point";
                                        geoObj["coordinates"] = [];
                                        geoObj["coordinates"].push(searchResults[1]["X"]); //long
                                        geoObj["coordinates"].push(searchResults[1]["Y"]); //lat
                                        leafletFeature["geometry"] = geoObj;
                                        leafletFeatures.push(leafletFeature);

                                        L.geoJson(leafletFeature,{
                                            onEachFeature: onEachFeature
                                        }).addTo(map);
                                    }                                    
                                }                                
                            });
                            console.log(leafletFeatures); 
                        });                
                    }
                });
                
            }
            
        }
    });

    
})
