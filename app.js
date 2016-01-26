var express = require("express");
var http = require("http");
var app     = express();
var mapshaper = require('mapshaper');
var fs = require("fs");

app.use(express.static(__dirname + '/app'));

//Store all HTML files in view folder.

app.get('/',function(req,res){
    res.sendFile((path.join(__dirname + '/index.html')));

  //It will find and locate index.html from View or Scripts
});

app.get('/geojson', function (req, res) {
   fs.readFile( __dirname + "/app/geojson/" + "buildings.json","utf8" ,function (err, data) {
   	data = JSON.parse(data);
   	res.send(data);
   	if (err) {
       return console.error(err);}
       // console.log(data);
       
   });
})

var postcode = "579827";

var urlString = "http://www.onemap.sg/API/services.svc/basicSearch?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal="+ postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=0&rset=1";

var request = require('request');


app.get('/getPostalCode/:id', function(req,res){
	var postcode = req.params.id;
	console.log("id " + postcode);
	var urlString = "http://www.onemap.sg/API/services.svc/basicSearch?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal="+ postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=0&rset=1";
	request(urlString, function (error, response, body) {
	 if (!error && response.statusCode == 200) {
	    // console.log(body) // Show the HTML for the Google homepage.
	    res.send(body);
	  }
	});
})

mapshaper.runCommands('-i app/data/*.shp -simplify dp 20% -o app/geojson/ format=geojson force');
// -i provinces.shp -simplify dp 20% -o format=geojson out.json
app.listen(3000);
console.log("Running at Port 3000");