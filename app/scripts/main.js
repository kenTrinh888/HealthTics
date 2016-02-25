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



// proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
$('#convert').submit(function(e) {
    var file = $("#upload")[0].files[0];

    var layerName = file.name;

    e.preventDefault();
    $(this).ajaxSubmit({
        // console.log("submit");
        success: function(data, textStatus, jqXHR) {

            console.log(data);
            var layer = {
                    "name": layerName,
                    "datamain": data
                }
                // layer.data = data
            var dataSend = JSON.stringify(layer);
            // console.log(dataSend);
            $.ajax({
                url: '/upload',
                type: 'POST',
                data: dataSend,
                contentType: 'application/json',

                success: function(data) {
                    console.log('success');
                    location.reload();
                }
            });
        }

    })

});
$.get("/getAllLayer", function(data) {
    var names = data;

    for (var i = 1; i < names.length; i++) {
        var name = names[i];


        var url = './geojson/' + name;

        $.getJSON(url, function(dataLoop) {

            // // console.log(dataLoop);
            // L.Proj.geoJson(dataLoop,function(){
            //     console.log(dataLoop)
            // });
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
var urlforHDB = 'ORResults/ORresult.json';
$.getJSON(urlforHDB, function(dataLoop) {

    for (var i = 0; i < dataLoop.length; i++) {

        var buffer = dataLoop[i].buffer;
        // console.log(buffer);
        L.geoJson(buffer, {
            pointToLayer: function(feature, latlng) {
                // console.log(latlng);
                // var name = feature.properties.Name;
                // console.log(feature.properties.Name);
                return L.marker(latlng, {
                    icon: redMarker
                })
            }
        }).addTo(map);
    }


});
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
// $.getJSON("/basemap/result.geojson", function (data){
//     console.log(data);
//      L.Proj.geoJson(data).addTo(map);

// })
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
            for (var propertyname in feature.properties) {
                // console.log(feature.properties[propertyname]);
                popupContent += "<b>" + propertyname + "</b>" + ": " + feature.properties[propertyname].toString() + "</br>";
            }
            layer.bindPopup(popupContent);
        }
    }
    var layerFiles = [];

    $('#files').change(function(evt) {
        var HDBsent = [];
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



                        for (var i = 0; i < fields.length; i++) {
                            field = fields[i];

                            var leafletFeature = new Object(); //single leaflet object
                            leafletFeature["type"] = "Feature";
                            leafletFeature["properties"] = field;
                            // console.log(leafletFeature);
                            var postcode = field["POSTCODE"].toString();
                            if (postcode.length < 6) {
                                postcode = "0" + postcode;
                            }
                            var localApi = '/getPostalCode/' + postcode;

                            $.get(localApi, function(geocodedData, status) {
                                var geocodedDataJson = JSON.parse(geocodedData); //response from geocoding API
                                searchResults = geocodedDataJson["SearchResults"]; //array containing response of geocoding API
                                if (searchResults[0].hasOwnProperty("ErrorMessage") === false) {
                                    if (searchResults.length > 1) {
                                        var longitude = searchResults[1]["X"];
                                        var latitude = searchResults[1]["Y"];
                                        var buildingQuery = latitude + "," + longitude;
                                        // var consumerKey = "Mub69kgiH4aBo6yLb1eAvdCBBgnGYHMf";
                                        // var OSMAPI =  "http://open.mapquestapi.com/nominatim/v1/search.php?key=Mub69kgiH4aBo6yLb1eAvdCBBgnGYHMf&format=json&polygon_geojson=1&json_callback=renderBasicSearchNarrative&q=" + buildingQuery;
                                        // console.log(OSMAPI);


                                        $.getJSON("/getPolygon/" + buildingQuery, function(data) {

                                            var properties = {}
                                            var display_name = data[0].display_name;
                                            var lat = data[0].lat;
                                            var lon = data[0].lon;
                                            properties["Name"] = display_name;
                                            properties["Latitude"] = lat;
                                            properties["Longitude"] = lon;
                                            properties["POSTAL CODE "] = postcode;
                                            // console.log(properties);

                                            var HDBbuilding = data[0].geojson;
                                            HDBbuilding["properties"] = properties;

                                            // console.log(JSON.stringify(HDBbuilding));
                                            HDBsent.push(HDBbuilding);
                                            var breakPoint = HDBsent.length;
                                            // HDBsentFinal = JSON.parse(HDBsent);
                                            // console.log(HDBsent);
                                            if (breakPoint === fields.length) {
                                                HDBJSON = JSON.stringify(HDBsent);
                                                // console.log(HDBJSON);
                                                $.ajax({
                                                    url: '/uploadHDB',
                                                    type: 'POST',
                                                    data: HDBJSON,
                                                    contentType: 'application/json',

                                                    success: function(data) {
                                                        console.log("sucess");
                                                        location.reload();
                                                    }
                                                });


                                            }

                                            // console.log(fields.length);
                                            // console.log(fields.length);
                                            // console.log("i" + i);
                                            // if(i === (fields.length - 1)){
                                            //     console.log("break");
                                            // }


                                            //      L.geoJson(HDBbuilding, {
                                            //     onEachFeature: onEachFeature
                                            // }).addTo(map);
                                        })


                                        // var geoObj = {};
                                        // geoObj["type"] = "Point";
                                        // geoObj["coordinates"] = [];
                                        // geoObj["coordinates"].push(searchResults[1]["X"]); //long
                                        // geoObj["coordinates"].push(searchResults[1]["Y"]); //lat
                                        // leafletFeature["geometry"] = geoObj;
                                        // leafletFeatures.push(leafletFeature);

                                        // L.geoJson(leafletFeature, {
                                        //     onEachFeature: onEachFeature
                                        // }).addTo(map);
                                    }
                                }
                            });



                        };



                    }
                });
            }
        }
    });


})
