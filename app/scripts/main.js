/*jslint browser: true*/
/*global L */


L.Icon.Default.imagePath = 'images/';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
/* create leaflet map */
var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 11
});
// var boundsSW = L.latLng(1.201023, 103.597500),
//     boundsNE = L.latLng(1.490837, 104.067218),
//     bounds = L.latLngBounds(boundsSW, boundsNE);
// map.setMaxBounds(bounds);
// var redMarkerTest = L.AwesomeMarkers.icon({
//  icon: 'cog',  prefix: 'fa', markerColor: 'purple', iconColor: '#6b1d5c'
// });

// L.marker([1.31, 103.8], {
//     icon: redMarkerTest
// }).addTo(map);



// $.get("/geojson", function(data, status){
//         district_boundary.addData(data);
//     }).error(function(err) {console.log(err)});

// $('#uploadFiles').click(function(evt,err) {
//     if(err){
//         console.log(err);
//     }

//         var files = evt.target.files;

//         for (var i = 0, f; f = files[i]; i++) {
//             console.log(f.name);ç
//         }
// });

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

// Creates a red marker with the coffee icon
// var redMarker = L.AwesomeMarkers.icon({
//   icon: 'coffee',
//   markerColor: 'red'
// });

// L.marker([51.941196,4.512291], {icon: redMarker}).addTo(map);
var redMarker = L.AwesomeMarkers.icon({
    icon: 'sitemap',
    markerColor: 'blue',
    prefix: 'fa'
});


$.get("/getAllLayer", function(data) {
    var names = data;
    for (var i = 1; i < names.length; i++) {
        var name = names[i];
        nameDis = name.split('.')[1];
        var url = 'geojson/' + name;
        $.getJSON(url, function(dataLoop) {
            L.geoJson(dataLoop, {
                pointToLayer: function(feature, latlng) {
                    var name = feature.properties.Name;
                    console.log(feature.properties.Name);
                    return L.marker(latlng,{icon: redMarker}).bindPopup(name );
                }
            }).addTo(map);

        });
        // var customLayer = L.geoJson(null, {
        //     // http://leafletjs.com/reference.html#geojson-style
        //     onEachFeature: handleFeature

        // });
        // omnivore.geojson(url, null, customLayer).addTo(map);

        // omnivore.geojson(url,{
        //     onEachFeature: handleFeature

        // }).addTo(map);



    }
})

function getSecondPart(str) {
    return str.split('-')[1];
}

// L.geoJson(url).addTo(map);

// $.get(url, function(data, status) {
//         // console.log(data);
//             L.geoJson(data).addTo(map);

//         });
// omnivore.kml('uploads/AQUATICSG.kml').addTo(map);
// omnivore.kml('uploads/HEALTHIERCATERERS.kml').addTo(map);

// omnivore.geojson('geojson/shapefile.json').addTo(map);

// $.get("/geojson/", function(data, status) {
//     L.geoJson(data,{
//         onEachFeature: handleFeature
//     }).addTo(map);

//     // omnivore.geojson(data, { onEachFeature: handleFeature}).addTo(map);


//     console.log(data);

// }).error(function(err) {
//     console.log(err);
// }); 


var postcode = "560624";

var urlString = "http://www.onemap.sg/API/services.svc/basicSearch?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1"

var url = '/getPostalCode/' + postcode;

$.get(url, function(data, status) {
    // console.log(data);
});



