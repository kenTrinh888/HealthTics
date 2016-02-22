L.Icon.Default.imagePath = 'images/';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
/* create leaflet map */
var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 11
});

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
        // console.log(prop);
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
var iconJc = L.AwesomeMarkers.icon({
    icon: 'fa-graduation-cap',
    markerColor: 'red',
    prefix: 'fa'
});

var redMarker = L.AwesomeMarkers.icon({
    icon: 'sitemap',
    markerColor: 'blue',
    prefix: 'fa'
});


$.get("/getAllLayer", function(data) {
    var names = data;

    for (var i = 1; i < names.length; i++) {
        var name = names[i];
        // console.log(name);
        // nameDis = name.split('.')[1];
        var url = './geojson/' + name;

        $.getJSON(url, function(dataLoop) {
            // console.log(dataLoop);
            L.geoJson(dataLoop, {
                pointToLayer: function(feature, latlng) {
                    // console.log(latlng);
                    // var name = feature.properties.Name;
                    // console.log(feature.properties.Name);
                    return L.marker(latlng, {
                        icon: redMarker
                    })
                }
            }).addTo(map);

        });
    }
})
// omnivore.geojson('/geojson/education.json').addTo(map);
// omnivore.geojson('/geojson/PLAYSG.geojson').addTo(map);
// function getSecondPart(str) {
//     return str.split('-')[1];
// }

$(document).ready(function() {
    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties) {
            var popupContent = "";
            console.log("a");
            for (var propertyname in feature.properties) {
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

                                        L.geoJson(leafletFeature, {
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
