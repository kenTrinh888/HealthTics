L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
/* create leaflet map */
var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 12
});
new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 50,
    attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
}).addTo(map);
// omnivore.geojson('/geojson/PLAYSG.json').addTo(map);
var redMarker = L.AwesomeMarkers.icon({
    icon: 'sitemap',
    markerColor: 'red',
    prefix: 'fa'
});
var blueMarker = L.AwesomeMarkers.icon({
    icon: 'sitemap',
    markerColor: 'blue',
    prefix: 'fa'
});
// proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
$('#convert').submit(function(e) {
    var postcodeContain = false;
    var file = $("#upload")[0].files[0];

    var layerName = file.name;

    e.preventDefault();

    $(this).ajaxSubmit({
        // console.log("submit");
        success: function(data, textStatus, jqXHR) {
            if (postcodeContain === true) {
                var arrayofPoints = data.features;

                for (index in arrayofPoints) {

                    aPoint = arrayofPoints[index];
                    var postcode = aPoint.properties.POSTALCODE;
                    if (postcode.length < 6) {
                        postcode = "0" + postcode;
                    }
                    var breakPoint = arrayofPoints.length;
                    getPostalCodeGeo(layerName, aPoint, postcode, breakPoint)
                        // data.features[index].geometry = [1,1];
                }

            } else {
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
            //     var layer = {
            //             "name": layerName,
            //             "datamain": data
            //         }
            //         // layer.data = data
            //     var dataSend = JSON.stringify(layer);
            //     // console.log(dataSend);
            //     $.ajax({
            //         url: '/upload',
            //         type: 'POST',
            //         data: dataSend,
            //         contentType: 'application/json',

            //         success: function(data) {
            //             console.log('success');
            //             location.reload();
            //         }
            //     });
        }

    })

});

function getPostalCodeGeo(layerName, aPoint, postcode, breakPoint) {
    breakPoint = parseInt(breakPoint);
    url = "/getPostalCode/" + postcode;
    InvalidPostalCode = []
    coordinateArray = [];
    $.getJSON(url, function(objectReturn) {
        // var breakPoint = parseInt(index) + 1;
        var objectLocation = { "type": "Point", "coordinates": objectReturn }
        if (!objectReturn.hasOwnProperty("postalcode")) {
            aPoint.geometry = objectLocation;
            // console.log(JSON.stringify(aPoint));
            coordinateArray.push(aPoint);
            // console.log(coordinateArray.length);

        } else {
            InvalidPostalCode.push(objectReturn);
            console.log(objectReturn);
        }
        var loopendPoint = coordinateArray.length + InvalidPostalCode.length;
        console.log(loopendPoint);
        if (loopendPoint === breakPoint) {
            console.log("dataSend");
            var dataReturn = {
                "type": "FeatureCollection",
                "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
                "features": []
            }
            dataReturn.features = coordinateArray;
            var layer = {
                    "name": layerName,
                    "datamain": dataReturn
                }
                // layer.data = data
            var dataSend = JSON.stringify(layer);
            // console.log(dataSend);
            $.ajax({
                url: '/uploadlayer',
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

}
// $.get("/getAllLayer", function(data) {
//     var names = data;
//     for (var i = 1; i < names.length; i++) {
//         var name = names[i];
//         var url = './geojson/' + name;
//         $.getJSON(url, function(dataLoop) {
//             // // console.log(dataLoop);
//             // L.Proj.geoJson(dataLoop,function(){
//             //     console.log(dataLoop)
//             // });
//             L.geoJson(dataLoop, {
//                 pointToLayer: function(feature, latlng) {
//                     // console.log(latlng);
//                     // var name = feature.properties.Name;
//                     // console.log(feature.properties.Name);
//                     return L.marker(latlng, {
//                         icon: redMarker
//                     })
//                 }
//             }).addTo(map);
//         });
//     }
// })
// var urlforHDB = 'ORResults/ORresult.json';
// $.getJSON(urlforHDB, function(dataLoop) {
//     for (var i = 0; i < dataLoop.length; i++) {
//         var points = dataLoop[i].points;
//         var buffer = dataLoop[i].buffer;
//         console.log(points);
//         L.geoJson(buffer, {
//             pointToLayer: function(feature, latlng) {
//                 // console.log(latlng);
//                 // var name = feature.properties.Name;
//                 // console.log(feature.properties.Name);
//                 return L.marker(latlng, {
//                     icon: redMarker
//                 })
//             }
//         }).addTo(map);
//         L.geoJson(points, {
//             pointToLayer: function(feature, latlng) {
//                 // console.log(latlng);
//                 // var name = feature.properties.Name;
//                 // console.log(feature.properties.Name);
//                 return L.marker(latlng, {
//                     icon: blueMarker
//                 })
//             }
//         }).addTo(map);
//     }
// });


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
        var findpolygon = false;
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
                        var objectsSend = [];
                        var lengthofHDBRequest = fields.length;
                        for (var i = 0; i < fields.length; i++) {
                            field = fields[i];
                            var leafletFeature = new Object(); //single leaflet object
                            leafletFeature["type"] = "Feature";
                            leafletFeature["properties"] = field;
                            // console.log(field);
                            // console.log(leafletFeature);
                            var postcode = field["POSTCODE"].toString();
                            console.log(lengthofHDBRequest);
                            if (postcode.length < 6) {
                                postcode = "0" + postcode;
                            }
                            field["length"] = lengthofHDBRequest;
                            objectsSend.push(field);
                

                        };
                           if (findpolygon) {

                                $.ajax({
                                    url: '/findHDBPolygon',
                                    type: 'POST',
                                    data: JSON.stringify(objectsSend),
                                    contentType: 'application/json',
                                    success: function(data) {
                                        // console.log(data);
                                        location.reload();
                                    }
                                });
                            } else {
                                $.ajax({
                                    url: '/findPostalCode',
                                    type: 'POST',
                                    data: JSON.stringify(objectsSend),
                                    contentType: 'application/json',
                                    success: function(data) {
                                        // console.log(data);
                                        location.reload();
                                    }
                                });
                            }
                    }
                });
            }
        }
    });
})
