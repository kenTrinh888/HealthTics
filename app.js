var express = require("express");
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

mapshaper.runCommands('-i app/data/*.shp -o app/geojson/ format=geojson force');
app.listen(3000);
console.log("Running at Port 3000");