var express = require("express");
var http = require("http");
var app = express();
var request = require('request');
var ogr2ogr = require('ogr2ogr');
var fs = require("fs");
var bodyParser = require('body-parser');
var multer = require('multer');
var busboy = require('connect-busboy');
var turf = require('turf');
var _ = require('lodash');
var mapshaper = require('mapshaper');
var globalurl = __dirname + '/app';


app.use(express.static(__dirname + '/app'));
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/app' + '/uploads')
    },
     onError : function(err, next) {
      console.log('error', err);
      next(err);
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

var SPdir = globalurl + "/basemap/SingaporePools.geojson" ;
var SingaporePools = JSON.parse(fs.readFileSync(SPdir, "utf8"));
// console.log(SingaporePools);
var SubzoneDir = globalurl + "/basemap/DGPSubZone.geojson";
var SubZone = JSON.parse(fs.readFileSync(SubzoneDir, "utf8"));

var counted = turf.count(SubZone, SingaporePools, 'pt_count');
var resultFeatures = SingaporePools.features.concat(counted.features);
var result = {
  "type": "FeatureCollection",
  "features": resultFeatures
};
// var jsonfile = require('jsonfile')
 
// var file = globalurl + '/basemap/result.json';

 
// jsonfile.writeFile(file, result, function (err) {
//   console.error(err)
// })
// app.get("/getResult", function (req,res){
//     // var resultSend = JSON
//     var file = ogr2ogr(file)
//         .format('GeoJSON')
//         .skipfailures()
//         .project("EPSG:3414")
//         .stream()
//     FILE.pipe(fs.createWriteStream(globalurl + '/'+ "basemap"+ '/' + "result" + '.geojson'))
// })
// fs.createWriteStream(globalurl + '/'+ 'basemap'+ '/' + result + '.geojson');
// convert(result,"Result","basemap");
// convert(result,result,"basemap");
// fs.writeFile(globalurl + "/basemap/result.geojson", result, function(err) {
//     if(err) {
//         return console.log(err);
//     }

//     console.log("The file was saved!");
// });
convert(result,"result","basemap");


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
    // console.log(name);
    var nameString = getSecondPart(name);
    var nameFirstPark = getFirstPart(name);
    var file = __dirname + "/" + name;
    var filePath = req.files[0].path;

    // if (nameString === "shp" || nameString === "zip"){
    // var from = "app/uploads" + "/"+name;
    // console.log(from);
    // var destination = "app/geojson/" + nameFirstPark +'.geojson' ;
    // console.log(destination);
    // var command = '-i ' + from + ' -o ' + destination + ' format=geojson force'
    // mapshaper.runCommands(command);
    // // convert(destination, nameFirstPark);
    // }else {
    //     // console.log(file);

    convert(filePath, nameFirstPark,"geojson");
    res.redirect("back");
});
// var dir =  __dirname + '/app' + '/geojson' ;
// var source = JSON.parse(require(dir + '/SingaporePools1.geojson'));
// fs.readFile(__dirname + "/app/geojson/" + "DGPSubZone.json", "utf8", function(err, data) {
// var reproject = require("reproject");
// fs.readFile(dir + '/SingaporePools1.geojson', "utf8", function(err, data) {
//     var source = JSON.parse(data);
//     console.log(source);
//     reproject(source, proj4.WGS84, crss);


// })

// convert shapefile to geojson
function convert(file, name,directory) {
    var FILE = ogr2ogr(file)
        .format('GeoJSON')
        .skipfailures()
        .project("EPSG:3414")
        .stream()
    FILE.pipe(fs.createWriteStream(globalurl + '/'+ directory+ '/' + name + '.geojson'))

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

function geoCoding (postcode){
    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";

    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var X = data.SearchResults[1].X; // Show the HTML for the Google homepage.
            var Y = data.SearchResults[1].Y;
            var coordinates = "{ 'X': " + X + ",'Y' :" + Y +"}";


        return coordinates;
                }
    });
}

// convert shapefile to geojson
function convert(file, name) {
    var shapefile = ogr2ogr(file)
        .format('GeoJSON')
        .skipfailures()
        // .project("EPSG:3414")
        .stream();
    console.log(globalurl + '/geojson/' + name + '.geojson');
    shapefile.pipe(fs.createWriteStream(globalurl + '/geojson/' + name + '.geojson'))
}

var postcodeQuery = geoCoding("560615");
// var json = {x:"1"}
// // console.log(json.x);
// JSON.parse(postcodeQuery);
// console.log(postcodeQuery);

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});


// API get all Layer Columns Name
app.get('/getAllLayerColumnName', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var name = fs.readdirSync(path);
    var objectsSend = [];
    for (var i = 1; i < name.length ; i++){       
        var aName = name[i];
        // if (aName === ".DS_Store"){
        //     break;
        // }
        var columnsnameArray = [];
        var object = {"name" : aName,"columns" : []};
        var dir = path + aName;
        // console.log(dir);
        var LayerFile = JSON.parse(fs.readFileSync(dir));
        var layerProperties = LayerFile.features[0].properties;
        for (key in layerProperties){
            columnsnameArray.push(key);
        }
        object.columns = columnsnameArray;
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
