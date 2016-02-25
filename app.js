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
var proj4 = require('proj4')
proj4.defs("EPSG:3414", "+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
app.use(express.static(__dirname + '/app'));
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/app' + '/uploads')
    },
    onError: function(err, next) {
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
// var SPdir = globalurl + "/basemap/SingaporePools.geojson" ;
// var SingaporePools = JSON.parse(fs.readFileSync(SPdir, "utf8"));
// // console.log(SingaporePools);
// var SubzoneDir = globalurl + "/basemap/DGPSubZone.geojson";
// var SubZone = JSON.parse(fs.readFileSync(SubzoneDir, "utf8"));
// var counted = turf.count(SubZone, SingaporePools, 'pt_count');
// var resultFeatures = SingaporePools.features.concat(counted.features);
// var result = {
//   "type": "FeatureCollection",
//   "features": resultFeatures
// };
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
// convert(result,"result","basemap");
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


function setFilterTableData(requestBody) {
    var filterTableData = [];
    for (var prop in requestBody) {
        for (var i = 0; i < requestBody[prop].length; i++) {
            if (!filterTableData[i]) {
                filterTableData[i] = {};
            }
            if (prop === "layerSelected") {
                var completeLayerName = requestBody[prop][i];
                var parentLayer, subLayer = "";
                if (completeLayerName.indexOf("_") != -1) {
                    subLayer = completeLayerName.split("_")[0];
                    parentLayer = completeLayerName.split("_")[1];
                } else {
                    subLayer = completeLayerName;
                    parentLayer = completeLayerName;
                }
                filterTableData[i]['parentLayer'] = parentLayer;
                filterTableData[i]['subLayer'] = subLayer;
            } else {
                filterTableData[i][prop] = requestBody[prop][i];
            }
        }
    }
    return filterTableData;
}
app.post('/upload', function(req, res) {
    var jsonString = '';
    req.on('data', function(data) {
        jsonString += data;
    });
    req.on('end', function() {
        var JSONReturn = JSON.parse(jsonString);
        // console.log(JSONReturn.datamain);
        var objectWrite = JSONReturn.datamain;
        var nameofFile = JSONReturn.name;
        // var beautyJSON = JSON.parse(objectWrite);
        //         for (var key in p) {
        //   if (p.hasOwnProperty(key)) {
        //     alert(key + " -> " + p[key]);
        //   }
        // }
        var features = objectWrite.features;
        for (var i = 0; i < features.length; i++) {
            var oldCor = features[i].geometry.coordinates;
            var newCoor = proj4(proj4("EPSG:3414")).inverse(oldCor);
            objectWrite.features[i].geometry.coordinates = newCoor;
        }
        var beautyJSON = JSON.stringify(objectWrite);
        console.log(beautyJSON);
        // for (var key in features) {
        //     console.log(features.geometry);
        // }
        var nameFirstPart = getFirstPart(nameofFile);
        var urlDestination = globalurl + "/geojson/" + nameFirstPart + ".geojson";
        fs.writeFile(urlDestination, beautyJSON, function(err) {
            if (err) {
                return console.log(err);
            }
        });
        res.redirect("back");
    })
});
// ===================================Upload HDB to folder=====================================
app.post("/uploadHDB", function(req, res) {
    var jsonString = '';
    req.on('data', function(data) {
        jsonString += data;
    });
    req.on('end', function() {
            var JSONReturn = JSON.parse(jsonString);
            var urlDestination = globalurl + "/HDB/HDB.json";
            fs.writeFile(urlDestination, JSON.stringify(JSONReturn), function(err) {
                if (err) {
                    return console.log(err);
                }
            });
            res.redirect("back");

        })
        // console.log( JSON.stringify(jsonString));
        // var JSONReturn = JSON.stringify(jsonString);
    console.log(req.body);


});
// ===================================Upload HDB to folder===========================================
// ===================================Recieve Filter and Process HDB=================================

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));

app.post('/submitFilter', function(req, res) {
    var objectReceived = [{
        "operator": "≥",
        "operator_amt": "2",
        "parentLayer": "Education",
        "SCH_TYPE": "JC", //Erwin : Change the key name
        "within_range": "1"
    }, {
        "operator": "≤",
        "operator_amt": "1",
        "parentLayer": "Education",
        "SCH_TYPE": "primary",
        "within_range": "2"
    }]

    // console.log(objectReceived[])


    var url = globalurl + "/HDB/HDB.json";
    fs.readFile(url, "utf8", function(err, data) {
        var HDB = JSON.parse(data);
        for (var i = 0; i < objectReceived.length; i++) {
            var lengthOfRequirements = objectReceived.length;
            ORrequirement = objectReceived[i];
            for (var m = 0; m < HDB.length; m++) {
                var aHDB = HDB[m];
                calculateBuffer(aHDB, ORrequirement, lengthOfRequirements, HDB.length);

            }
        }
    })

    // console.log(objectCalculated);

    // console.log(HDB);
    // var filterTableData = setFilterTableData(request.body);
    // var filterTableData = JSON.stringify(request.body);
    // console.log(req.body)

    // fs.readFile(url, "utf8",function(err, data) {
    //     var HDB = JSON.parse(data);
    //     console.log(HDB[0]);

    // })

    // console.log(filterTableData);
    // fs.readFile(url, "utf8",function(err, data) {
    //     var HDB = JSON.parse(data);
    //     console.log(HDB[0]);

    // })
    res.redirect("/");
    //ken do from here
});

function calculateBuffer(aHDB, ORrequirement, lengthOfRequirements, lengthofHDBfile) {
    // var url = globalurl + "/HDB/HDB.json";
    // fs.readFile(url, "utf8", function(err, data) {
    //     var HDB = JSON.parse(data);
    result = [];
    // for (var m = 0; m < HDB.length; m++) {
    //     var aHDB = HDB[m];

    var currentPoint = {
        "type": "Feature",
        "properties": {},
        "geometry": {}
    };
    currentPoint["properties"] = aHDB.properties;
    currentPoint["geometry"]["coordinates"] = aHDB.coordinates;
    currentPoint["geometry"]["type"] = aHDB.type;
    var unit = "kilometers";
    var distance = parseInt(ORrequirement.within_range);
    var HDBbuffered = turf.buffer(currentPoint, distance, unit);
    HDBbuffered.features[0].properties = {
        "fill": "#6BC65F",
        "stroke": "#25561F",
        "stroke-width": 2
    };
    HDBbuffered.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
        urlLayerRetrieved = globalurl + "/geojson/" + ORrequirement.parentLayer + ".geojson";
    // var file = fs.readFile(urlLayerRetrieved, "utf8", function(err, dataLayer) {
    // })
    // console.log(file);
    fs.readFile(urlLayerRetrieved, "utf8", function(err, dataLayer) {
        var objectSend = { "buffer": null, "points": null };

        // retrieved Layer Object
        var layerRequest = JSON.parse(dataLayer);

        //Filter necssary Layer
        var key = Object.keys(ORrequirement)[3];
        var value = ORrequirement[key];
        var filtered = turf.filter(layerRequest, key, value);

        // Check Buffer Point Within
        var ptsWithin = turf.within(filtered, HDBbuffered);
        ptsWithin.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
        HDBbuffered.features.push(currentPoint)
        objectSend.buffer = HDBbuffered;
        objectSend.points = ptsWithin;
        console.log("======================================================");
        // console.log("key " + key);
        // console.log("value "+ value);
        // console.log(filtered);
        // console.log(JSON.stringify(ptsWithin));
        console.log("======================================================");
        // if(lengthOfRequirements === 2){
        //     console.log(JSON.stringify(layerRequest));
        // }
        
        // console.log("key " + key);
        // console.log("value "+ value);
        // console.log(filtered);
        // console.log(JSON.stringify(ptsWithin));

        var breakPoint = lengthOfRequirements * lengthofHDBfile;
        result.push(objectSend);
        // console.log(result);

        // console.log(JSON.stringify(ptsWithin));

        // console.log("length :" + result.length);
        if (result.length === breakPoint) {
            var urlDestination = globalurl + "/ORResults/ORresult.json";
            fs.writeFile(urlDestination, JSON.stringify(result), function(err) {
                if (err) {
                    return console.log(err);
                }
            });

        }


    });
    // }

    // })
}
// ===================================Recieve Filter and Process HDB=================================



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
function convert(file, name, directory) {
    var FILE = ogr2ogr(file)
        .format('GeoJSON')
        .skipfailures()
        .project("EPSG:3414")
        .stream()
    FILE.pipe(fs.createWriteStream(globalurl + '/' + directory + '/' + name + '.geojson'))
}
//end file upload
//read all files in a folder //
app.get('/getAllLayer', function(req, res) {
    var path = __dirname + '/app' + '/geojson';
    var name = fs.readdirSync(path);
    res.send(name);
});
app.get('/getPolygon/:coordinates', function(req, res) {
        var coordinates = req.params.coordinates;
        var consumerKey = "Mub69kgiH4aBo6yLb1eAvdCBBgnGYHMf";
        var APItest = "http://open.mapquestapi.com/nominatim/v1/search.php?key=" + consumerKey + "&format=json&polygon_geojson=1&q=" + coordinates;
        request(APItest, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                // console.log(body) // Show the HTML for the Google homepage.
                res.send(JSON.parse(body));
            }
        });
    })
    // end read all files from folder
app.get('/getPostalCode/:id', function(req, res) {
    var postcode = req.params.id;
    // console.log("id " + postcode);
    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body) // Show the HTML for the Google homepage.
            res.send(body);
        }
    });
})

function geoCoding(postcode) {
    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var X = data.SearchResults[1].X; // Show the HTML for the Google homepage.
            var Y = data.SearchResults[1].Y;
            var coordinates = "{ 'X': " + X + ",'Y' :" + Y + "}";
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
    shapefile.pipe(fs.createWriteStream(globalurl + '/geojson/' + name + '.geojson'))
}
var postcodeQuery = geoCoding("560615");
// var json = {x:"1"}
// // console.log(json.x);
// JSON.parse(postcodeQuery);
// console.log(postcodeQuery);
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});
// API get all Layer Columns Name
app.get('/getAllLayerColumnName', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var name = fs.readdirSync(path);
    var objectsSend = [];
    for (var i = 1; i < name.length; i++) {
        var aName = name[i];
        // if (aName === ".DS_Store"){
        //     break;
        // }
        var columnsnameArray = [];
        var object = { "name": aName, "columns": [] };
        var dir = path + aName;
        // console.log(dir);
        var LayerFile = JSON.parse(fs.readFileSync(dir));
        var layerProperties = LayerFile.features[0].properties;
        for (key in layerProperties) {
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
