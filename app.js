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
        // console.log(beautyJSON);
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

function createEmptyFilterTableData(requestBody){
    var filterTableData = [];
    if(Array.isArray(requestBody["operator"])){ //if the requestBody object is an array
        requestBody["operator"].forEach(function(element,index){
            filterTableData.push({});
        })
    }else{
        filterTableData.push({});
    }
    return filterTableData;
}

function setFilterTableForArray(filterTableData, requestBody, prop){
    requestBody[prop].forEach(function(element,i){
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
            filterTableData[i]["parentLayer"] = parentLayer;
            filterTableData[i]["subLayer"] = subLayer;
        } 
        else {
            filterTableData[i][prop] = requestBody[prop][i];
        }
    });
    return filterTableData;
}
function setFilterTableData(requestBody) {
    console.log(requestBody);   
    try{
        var filterTableData = createEmptyFilterTableData(requestBody);
        for (var prop in requestBody) {
            if(Array.isArray(requestBody[prop])){
                filterTableData = setFilterTableForArray(filterTableData, requestBody, prop);
            } else{
                // filterTableData[i]["parentLayer"] = parentLayer;
                //         filterTableData[i]["subLayer"] = subLayer;
            }              
        };
        console.log(filterTableData);
    }
    catch(AssertionFailedException){
        console.log("e");
    }
    
    return filterTableData;
}

// ===================================Recieve Filter and Process HDB=================================
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));
app.post('/submitFilter', function(req, res) {
    // var objectReceived = [{
    // "operator": "≥",
    // "operator_amt": "1",
    // "parentLayer": "Education",
    // "SCH_TYPE": "secondary", //Erwin : Change the key name
    // "within_range": "5"
    // }];
    // console.log(objectReceived[])
    // objectReceived = req.body;
    objectReceived = setFilterTableData(req.body); //transform data to the preferred geojson format
    // console.log(objectReceived);
    // console.log(objectReceived);
    var url = globalurl + "/HDB/HDB.json";
    fs.readFile(url, "utf8", function(err, data) {
        var HDB = JSON.parse(data);
        for (var m = 0; m < HDB.length; m++) {
            var aHDB = HDB[m];
            for (var i = 0; i < objectReceived.length; i++) {
                var lengthOfRequirements = objectReceived.length;
                ORrequirement = objectReceived[i];
                calculateBuffer(aHDB, ORrequirement, lengthOfRequirements, HDB.length);
            }
        }
    })
    res.redirect("/");
    //ken do from here
});

function calculateBuffer(aHDB, ORrequirement, lengthOfRequirements, lengthofHDBfile) {
    // var url = globalurl + "/HDB/HDB.json";
    // fs.readFile(url, "utf8", function(err, data) {
    //     var HDB = JSON.parse(data);
    requirementArray = [];
    HDBArray = [];
    result = [];
    TempHDBArray = [];
    // for (var m = 0; m < HDB.length; m++) {
    //     var aHDB = HDB[m];
    var typeofGEOJSOB = aHDB.type;
    if (typeofGEOJSOB === "Feature") {
        var currentPoint = aHDB;
    } else {
        var currentPoint = {
            "type": "Feature",
            "properties": {},
            "geometry": {}
        };
        currentPoint["properties"] = aHDB.properties;
        currentPoint["geometry"]["coordinates"] = aHDB.coordinates;
        currentPoint["geometry"]["type"] = aHDB.type;
    }
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
        var requirement = {};
        requirement["requirement_description"] = ORrequirement;
        requirement["requirement_points"] = ptsWithin;
        var numberofPoints = ptsWithin.features.length;
        var operator = ORrequirement.operator;
        var operator_amt = ORrequirement.operator_amt;

        if(operator === "≥"){
           if(numberofPoints >= operator_amt){
                requirement["requirement_result"] = true;
           }else {
                requirement["requirement_result"] = false;
           }
        } else if (operator === "≤"){
            if(numberofPoints <= operator_amt){
                requirement["requirement_result"] = true;
           }else {
                requirement["requirement_result"] = false;
           }
        }else{
             if(numberofPoints === operator_amt){
                requirement["requirement_result"] = true;
           }else {
                requirement["requirement_result"] = false;
           }
        }
        var hdbOBject = TempHDBArray[TempHDBArray.length - 1];
        // var currentPoint["geometry"]["coordinates"]
        TempHDBArray.push(currentPoint);
        if (_.isEqual(hdbOBject, currentPoint)) {
            // console.log(true);
            // console.log(HDBArray);
            var hdbOBject = _.find(HDBArray, function(HDB) {
                // console.log(currentPoint);
                return HDB.HDB_details === JSON.stringify(currentPoint);
            });
            // console.log(object);
            hdbOBject["ORREquirement"].push(requirement);
        } else {
            // console.log(false);
            var HDB = { "ORREquirement": [] };
            HDB["HDB_details"] = JSON.stringify(currentPoint);
            HDB.ORREquirement.push(requirement);
            HDBArray.push(HDB)
        }
        var breakPoint = lengthOfRequirements * lengthofHDBfile;
        if (TempHDBArray.length === breakPoint) {
            var path = globalurl + "/ORResults/";
            var name = fs.readdirSync(path);
            var rowCount = name.length;
            // console.log(HDBArray);
           
            var ANDREquirementNameFile = "ORresult" + rowCount;
            var urlDestination = globalurl + "/ORResults/" + ANDREquirementNameFile + ".json";
            
            for (var i = 0; i < HDBArray.length; i++){
                
                var oneHDB = HDBArray[i];
                 // console.log(oneHDB);
                var ORREquirementArray = oneHDB.ORREquirement;
                var evaluationArray = [];
                for (var m = 0 ; m < ORREquirementArray.length ; m++){
                    var evaluation = ORREquirementArray[m].requirement_result;
                    evaluationArray.push(evaluation);
                }

                var totalEvaluation = _.uniq(evaluationArray);
                // console.log(evaluationArray);

                if(totalEvaluation.length > 1 ){
                    HDBArray[i]["totalRequirement"] = true;
                }else{
                    if(totalEvaluation[0] === true){
                        HDBArray[i]["totalRequirement"] = true;
                    }else{
                        HDBArray[i]["totalRequirement"] = false;
                    }
                }

            }
            fs.writeFile(urlDestination, JSON.stringify(HDBArray), function(err) {
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
app.post('/findHDBPolygon', function(req, res) {
        var objectReceived = req.body;
        // console.log(JSON.stringify(objectReceived));
        var lengthOfRequest = objectReceived.length;
        var postcode = String(objectReceived.POSTCODE);
        // console.log("id " + postcode);
        if (postcode.length < 6) {
            postcode = "0" + postcode;
        }
        var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
        leafletFeatures = [];
        request(urlString, function(error, response, geocodedData) {
            if (!error && response.statusCode == 200) {
                var geocodedDataJson = JSON.parse(geocodedData);
                searchResults = geocodedDataJson["SearchResults"]; //array containing response of geocoding API
                var leafletFeature = new Object(); //single leaflet object
                leafletFeature["type"] = "Feature";
                leafletFeature["properties"] = objectReceived;
                if (searchResults[0].hasOwnProperty("ErrorMessage") === false) {
                    if (searchResults.length > 1) {
                        var longitude = searchResults[1]["X"];
                        var latitude = searchResults[1]["Y"];
                        var coordinates = latitude + "," + longitude;
                        var consumerKey = "Mub69kgiH4aBo6yLb1eAvdCBBgnGYHMf";
                        var APItest = "http://open.mapquestapi.com/nominatim/v1/search.php?key=" + consumerKey + "&format=json&polygon_geojson=1&q=" + coordinates;
                        HDBArray = [];
                        request(APItest, function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                // console.log(body) // Show the HTML for the Google homepage.
                                var data = JSON.parse(body);
                                // console.log(HDBPoly);
                                var properties = {}
                                var display_name = data[0].display_name;
                                var lat = data[0].lat;
                                var lon = data[0].lon;
                                // properties["Name"] = display_name;
                                // properties["Latitude"] = lat;
                                // properties["Longitude"] = lon;
                                // properties["POSTAL CODE "] = postcode;
                                // console.log(properties);
                                var HDBbuilding = new Object();
                                HDBbuilding = data[0].geojson;
                                // console.log(objectReceived);
                                HDBbuilding["properties"] = objectReceived;
                                HDBArray.push(HDBbuilding);
                                var lengthOfHDB = HDBArray.length;
                                if (lengthOfHDB === lengthOfRequest) {
                                    var urlDestination = globalurl + "/HDB/HDB.json";
                                    fs.writeFile(urlDestination, JSON.stringify(HDBArray), function(err) {
                                        if (err) {
                                            return console.log(err);
                                        }
                                    });
                                }

                            }
                        })
                    }
                }
            }
        });
        res.redirect("/");
    })
    // ======================
app.post('/findPostalCode', function(req, res) {
        var objectReceived = req.body;
        // console.log(JSON.stringify(objectReceived));
        var lengthOfRequest = objectReceived.length;
        var postcode = String(objectReceived.POSTCODE);
        // console.log("id " + postcode);
        if (postcode.length < 6) {
            postcode = "0" + postcode;
        }
        var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
        leafletFeatures = [];
        request(urlString, function(error, response, geocodedData) {
            if (!error && response.statusCode == 200) {
                var geocodedDataJson = JSON.parse(geocodedData);
                searchResults = geocodedDataJson["SearchResults"]; //array containing response of geocoding API
                var leafletFeature = new Object(); //single leaflet object
                leafletFeature["type"] = "Feature";
                leafletFeature["properties"] = objectReceived;
                if (searchResults[0].hasOwnProperty("ErrorMessage") === false) {
                    if (searchResults.length > 1) {
                        var longitude = searchResults[1]["X"];
                        var latitude = searchResults[1]["Y"];
                        var geoObj = {};
                        geoObj["type"] = "Point";
                        geoObj["coordinates"] = [];
                        geoObj["coordinates"].push(parseFloat(longitude)); //long
                        geoObj["coordinates"].push(parseFloat(latitude)); //lat
                        leafletFeature["geometry"] = geoObj;
                        leafletFeatures.push(leafletFeature);
                        var lengthOfHDB = leafletFeatures.length;
                        if (lengthOfHDB === lengthOfRequest) {
                            var urlDestination = globalurl + "/HDB/HDB.json";
                            fs.writeFile(urlDestination, JSON.stringify(leafletFeatures), function(err) {
                                if (err) {
                                    return console.log(err);
                                }
                            });
                        }
                    }
                }
            }
        });
        res.redirect("/");
    })
//     // convert shapefile to geojson
// function convert(file, name) {
//     var shapefile = ogr2ogr(file)
//         .format('GeoJSON')
//         .skipfailures()
//         // .project("EPSG:3414")
//         .stream();
//     shapefile.pipe(fs.createWriteStream(globalurl + '/geojson/' + name + '.geojson'))
// }
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});
// API get all Layer Columns Name
app.get('/getAllLayerColumnName', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var name = fs.readdirSync(path);
    var objectsSend = [];
    for (var i = 0; i < name.length; i++) {
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
