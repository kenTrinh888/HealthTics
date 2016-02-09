L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
/* create leaflet map */
var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 12
});

// features = JSON.parse(feature);
// omnivore.geojson(features).addTo(map);

// $.getJSON('/geojson/PLAYSG.json', function(data) {
//     omnivore.geojson(data).addTo(map);
// })
new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 50,
    attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
}).addTo(map);
// omnivore.geojson('/geojson/PLAYSG.json').addTo(map);

var redMarker = L.AwesomeMarkers.icon({
    icon: 'sitemap',
    markerColor: 'blue',
    prefix: 'fa'
});

// var url = 'geojson/PLAYSG.geojson';
// $.getJSON(url, function(dataLoop) {
//      L.geoJson(dataLoop, {
//                 pointToLayer: function(feature, latlng) {
//                     // console.log(latlng);
//                     // var name = feature.properties.Name;
//                     // console.log(feature.properties.Name);
//                     return L.marker(latlng, {
//                         icon: redMarker
//                     })
//                 }
//             }).addTo(map);
    

// });
proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");

$.get("/getAllLayer", function(data) {
    var names = data;

    for (var i = 1; i < names.length; i++) {
        var name = names[i];
                    console.log(name);

        // console.log(name);
        // nameDis = name.split('.')[1];
        var url = './geojson/' + name;

        $.getJSON(url, function(dataLoop) {
            // // console.log(dataLoop);
            // L.Proj.geoJson(dataLoop,function(){
            //     console.log(dataLoop)
            // });
            L.Proj.geoJson(dataLoop, {

                pointToLayer: function(feature, latlng) {
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

// $.getJSON("basemap/SingaporePools.geojson", function(data) {
//      L.Proj.geoJson(data, {

//                 pointToLayer: function(feature, latlng) {
//                     // var name = feature.properties.Name;
//                     // console.log(feature.properties.Gp1Gp2Winn);
//                     return L.marker(latlng, {
//                         // radius: feature.properties.Gp1Gp2Winn
//                         icon: redMarker
//                     })
//                 }
//             }).addTo(map);

// })
// $.getJSON("basemap/DGPSubZone.geojson", function(data) {
//      console.log(data)
//      L.Proj.geoJson(data).addTo(map);

// })
$.getJSON("/basemap/result.geojson", function (data){
    console.log(data);
     L.Proj.geoJson(data).addTo(map);

})
// $.getJSON("basemap/result.geojson", function(data) {
//      console.log(data)
//      L.Proj.geoJson(data).addTo(map);

// })
// omnivore.geojson('/geojson/SingaporePools.geojson').addTo(map);
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
