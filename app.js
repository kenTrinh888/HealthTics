var express = require("express");
var http = require("http");
var app = express();
var request = require('request');
var ogr2ogr = require('ogr2ogr');
var fs = require("fs");
var bodyParser = require('body-parser');
var multer = require('multer');
var busboy = require('connect-busboy');
var globalurl = __dirname + '/app';
var turf = require('turf');
var gdal = require("gdal");
var _ = require('lodash');
var mapshaper = require('mapshaper');

app.use(express.static(__dirname + '/app'));
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/app' + '/uploads')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});



var upload = multer({
    storage: storage
});
app.use(busboy());


//Store all HTML files in view folder.

app.get('/', function(req, res) {
    res.sendFile((path.join(__dirname + '/index.html')));

    //It will find and locate index.html from View or Scripts
});

app.get('/geojson', function(req, res) {
    fs.readFile(__dirname + "/app/geojson/" + "buildings.json", "utf8", function(err, data) {
        data = JSON.parse(data);
        res.send(data);
        if (err) {
            return console.error(err);
        }
        // console.log(data);

    });
})


// get the name for file
function getSecondPart(str) {
    return str.split('.')[1];
}
function getFirstPart(str) {
    return str.split('.')[0];
}


app.post('/upload', upload.array('avatar'), function(req, res) {
    // var newPath = __dirname + "/uploads/uploadedFileName";
    var name = req.files[0].originalname;
    console.log(name);
    var nameString = getSecondPart(name);
    var nameFirstPark = getFirstPart(name);
    var file = __dirname + "/" + name;
    var filePath = req.files[0].path;
    if (nameString === "shp" || nameString === "zip"){
    var from = "app/uploads" + "/"+name;
    console.log(from);
    var destination = "app/geojson/" + nameFirstPark +'.geojson' ;
    console.log(destination);
    var command = '-i ' + from + ' -o ' + destination + ' format=geojson force'
    mapshaper.runCommands(command);
    // convert(destination, nameFirstPark);
    }else {
        // console.log(file);
        convert(filePath, nameFirstPark);

    }
 



    res.redirect("back");


});
// convert shapefile to geojson
function convert(file, name) {
    var FILE = ogr2ogr(file)
        .format('GeoJSON')
        .skipfailures()
        .project("EPSG:3414")
        .stream()
    FILE.pipe(fs.createWriteStream(globalurl + '/geojson/' + name + '.geojson'))

}




//end file upload

//read all files in a folder //
app.get('/getAllLayer', function(req, res) {
    var path = __dirname + '/app' + '/geojson';
    var name = fs.readdirSync(path);
    res.send(name);
});

// end read all files from folder 


app.get('/getPostalCode/:id', function(req, res) {
    var postcode = req.params.id;
    // console.log("id " + postcode);
    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) // Show the HTML for the Google homepage.
            res.send(body);
        }
    });
})



// API get all Layer Columns Name
app.get('/getAllLayerColumnName/', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var name = fs.readdirSync(path);
    var objectsSend = [];
    for (var i = 0; i < name.length; i++) {

        var aName = name[i];
        var object = {
            "name": aName,
            "coloumns": []
        };
        var dir = path + aName;
        var dataset = gdal.open(dir);
        var layer = dataset.layers.get(0);
        var columnsname = layer.fields.getNames();
        object.coloumns = columnsname;
        objectsSend.push(object);
    }
    res.send(objectsSend);
});
// API get all Layer Columns Values
app.get('/getAllLayerColumnValues/:nameOfFile/:columnName', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var nameOfFile = req.params.nameOfFile;
    nameOfFile = nameOfFile + ".geojson";
    var columnName = req.params.columnName;
    // var nameOfLayer = fs.readdirSync(path);
    var propertiesArray = [];
    var featureCollectionFile = path + nameOfFile;
    var featurecollection = JSON.parse(fs.readFileSync(featureCollectionFile));
    var featuresProp = featurecollection.features;
    for (var i = 0; i < featuresProp.length; i++) {

        var nameObject = featuresProp[i].properties;
        for (var key in nameObject) {
            if (key === columnName) {
                propertiesArray.push(nameObject[key]);
            }
        }

    }
    var result = _.uniq(propertiesArray);
    res.send(result);
});

app.listen(3000);
console.log("Running at Port 3000");
