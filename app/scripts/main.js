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
omnivore.geojson('geojson/buildings.json').addTo(map);

// $.get("/geojson", function(data, status) {
//     L.geoJson(data,{
//         onEachFeature: handleFeature
//     }).addTo(map);

//     // omnivore.geojson(data, { onEachFeature: handleFeature}).addTo(map);


//     // console.log(data);

// }).error(function(err) {
//     console.log(err);
// }); 
var postcode = "560624";

var urlString = "http://www.onemap.sg/API/services.svc/basicSearch?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal="+ postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1"

var url= '/getPostalCode/' + postcode;

 $.get(url, function(data, status){
    console.log(data);
    });
