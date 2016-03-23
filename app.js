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
var path = require('path');
var mapshaper = require('mapshaper');
var globalurl = __dirname + '/app';
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
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
app.get('/reporting', function(req, res) {
    res.sendFile((path.join(globalurl + '/reporting.html')));
    //It will find and locate reporting.html from View or Scripts
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
        var objectWrite = JSONReturn.datamain;
        var nameofFile = JSONReturn.name;

        var features = objectWrite.features;
        for (var i = 0; i < features.length; i++) {
            var oldCor = features[i].geometry.coordinates;
            var newCoor = proj4(proj4("EPSG:3414")).inverse(oldCor);
            objectWrite.features[i].geometry.coordinates = newCoor;
        }
        var beautyJSON = JSON.stringify(objectWrite);
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
app.post('/uploadlayer', function(req, res) {
    var jsonString = '';
    req.on('data', function(data) {
        jsonString += data;
    });
    req.on('end', function() {
        var JSONReturn = JSON.parse(jsonString);
        var objectWrite = JSONReturn.datamain;
        var nameofFile = JSONReturn.name;

        var beautyJSON = JSON.stringify(objectWrite);

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

function createEmptyFilterTableData(requestBody) {
    var filterTableData = [];
    if (Array.isArray(requestBody["operator"])) { //if the requestBody object is an array
        requestBody["operator"].forEach(function(element, index) {
            filterTableData.push({});
        })
    } else {
        filterTableData.push({});
    }
    return filterTableData;
}

function setFilterTableForSingleRow(filterTableData, requestBody, prop) {
    if (prop === "layerSelected") {
        var completeLayerName = requestBody[prop];
        var parentLayer, subLayer = "";
        if (completeLayerName.indexOf("_") != -1) {
            subLayer = completeLayerName.split("_")[0];
            parentLayer = completeLayerName.split("_")[1];
        } else {
            subLayer = completeLayerName;
            parentLayer = completeLayerName;
        }
        filterTableData[0]["parentLayer"] = parentLayer;
        filterTableData[0]["subLayer"] = subLayer;
    } else {
        filterTableData[0][prop] = requestBody[prop];
    }

    return filterTableData;
}

function setFilterTableForMultipleRows(filterTableData, requestBody, prop) {
    requestBody[prop].forEach(function(element, i) {
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
        } else {
            filterTableData[i][prop] = requestBody[prop][i];
        }
    });
    return filterTableData;
}

function setFilterTableData(requestBody) {
    // console.log(requestBody);
    try {
        var filterTableData = createEmptyFilterTableData(requestBody);
        for (var prop in requestBody) {
            if (Array.isArray(requestBody[prop])) {
                filterTableData = setFilterTableForMultipleRows(filterTableData, requestBody, prop);
            } else {
                filterTableData = setFilterTableForSingleRow(filterTableData, requestBody, prop);
            }
        };
        // console.log(filterTableData);
    } catch (err) {
        console.log("err: " + err);
    }

    return filterTableData;
}

// ===================================Recieve Filter and Process HDB=================================
app.use(bodyParser.json({ limit: '50mb' })); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({
    limit: '50mb', // to support URL-encoded bodies
    extended: true
}));

app.post('/deleteORResult', function(req, res) {
    fileToDelete = req.body;
    fs.unlinkSync(fileToDelete.directory);
    console.log("deleted:" + fileToDelete.directory);
    res.redirect('/');
});



//don't care about this one below
app.post('/sendModifiedRequirements', function(req, res) {
    //ken modify from here
    // var requirements = req.body;
    // console.log(requirements);
    // console.log("sendModifiedRequirements");
})

app.get('/checkFileExists/:kpiName', function(req, res) {
    // console.log(req.params.kpiName);
    var nameOfFinalResult = req.params.kpiName + ".geojson";
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    var existingFiles = fs.readdirSync(folderDestination);
    var doesFileExist = existingFiles.indexOf(nameOfFinalResult) != -1;
    // console.log("existed file name: " + existingFiles.toString());
    // console.log(nameOfFinalResult);
    // console.log(doesFileExist);
    res.send(doesFileExist);
})

app.post('/sendFinalRequirements', function(req, res) {
    var requirements = req.body;
    var nameOfFinalResult = requirements.kpiName + ".geojson";;
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    var urlDestination = folderDestination + nameOfFinalResult;

    fs.writeFile(urlDestination, JSON.stringify(requirements), function(err) {
        if (err) {
            return console.log(err);
        }
    });

    res.redirect('/');
})

app.get('/getAllKPIs', function(req, res) {
    var existingKPIFiles = [];
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    existingKPIFiles = fs.readdirSync(folderDestination);
    // console.log(existingKPIFiles);
    var KPIJsons = [];
    existingKPIFiles.forEach(function(kpiFile, index) {
        var KPIUrl = folderDestination + kpiFile;
        var KPIData = fs.readFileSync(KPIUrl);
        var KPIJson = JSON.parse(KPIData);
        KPIJsons.push(KPIJson);
    })
    res.send(KPIJsons);
})

app.post('/submitFilter', function(req, res) {
    objectReceived = setFilterTableData(req.body); //transform data to the preferred geojson format
    var url = globalurl + "/HDB/HDB.json";
    var HDB = JSON.parse(fs.readFileSync(url, "utf8"));
    CalculateFacilities(HDB, objectReceived);
    res.redirect("/");


});

function CalculateFacilities(HDB, objectReceived) {
    // console.log(JSON.stringify(HDB));
    var HDBArray = [];

    var HDBObject = {};
    for (var i = 0; i < objectReceived.length; i++) {

        var ORrequirementSend = objectReceived[i];
        // console.log(ORrequirement);
        var urlLayerRetrieved = globalurl + "/geojson/" + ORrequirementSend.parentLayer + ".geojson";
        var layerRequest = JSON.parse(fs.readFileSync(urlLayerRetrieved));

        for (var m = 0; m < HDB.length; m++) {

            var aHDB = HDB[m];
            var requirementReturns = calculateBuffer(aHDB, layerRequest, ORrequirementSend);
            HDBObject = { "ORREquirement": [], "HDB_JSON": aHDB }
                // HDBObject
            if (HDBArray[m] == null) {
                HDBObject.ORREquirement.push(requirementReturns);
                HDBArray[m] = HDBObject;
            } else {
                HDBArray[m].ORREquirement.push(requirementReturns);
            }
        }
        // HDBArray.push(HDBObject);

    }


    var path = globalurl + "/ORResults/";
    var name = fs.readdirSync(path);
    // console.log(name);
    var rowCount = name.length;
    // console.log("first" + rowCount);
    for (var i = 0; i < name.length; i++) {
        if (name[i] === ".DS_Store") {
            rowCount = rowCount - 1;
        }

    }

    // console.log("before" + rowCount);
    if (rowCount > 0) {
        var lastName = name[name.length - 1];
        // console.log(lastName);
        var LastNameExceptJSONextension = lastName.split(".")[0];
        var lastChar = LastNameExceptJSONextension.substr(LastNameExceptJSONextension.length - 1);
        // console.log(lastChar);
        rowCount = parseInt(lastChar) + 1;
    }
    // console.log("after" + rowCount);

    var ANDREquirementNameFile = "ORresult" + rowCount;
    var urlDestination = globalurl + "/ORResults/" + ANDREquirementNameFile + ".json";
    for (var i = 0; i < HDBArray.length; i++) {

        var oneHDB = HDBArray[i];
        // console.log(oneHDB);
        var ORREquirementArray = oneHDB.ORREquirement;
        var evaluationArray = [];
        for (var m = 0; m < ORREquirementArray.length; m++) {
            var evaluation = ORREquirementArray[m].requirement_result;
            evaluationArray.push(evaluation);
        }

        var totalEvaluation = _.uniq(evaluationArray);
        // console.log(evaluationArray);

        if (totalEvaluation.length > 1) {
            HDBArray[i]["totalRequirement"] = true;
        } else {
            if (totalEvaluation[0] === true) {
                HDBArray[i]["totalRequirement"] = true;
            } else {
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

function calculateBuffer(aHDB, layerRequest, ORrequirement) {
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
    var distanceTranslated = distance / 1000;
    var HDBbuffered = turf.buffer(currentPoint, distanceTranslated, unit);
    HDBbuffered.features[0].properties = {
        "fill": "#6BC65F",
        "stroke": "#25561F",
        "stroke-width": 2
    };
    HDBbuffered.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
        urlLayerRetrieved = globalurl + "/geojson/" + ORrequirement.parentLayer + ".geojson";
    var filtered = {}
    var key = ORrequirement.sublayer_column;
    if (key != 'N/A') {
        var value = ORrequirement.subLayer;
        filtered = turf.filter(layerRequest, key, value);
        // console.log(value);
        // Check Buffer Point Within
    } else {
        filtered = layerRequest;
    }
    var ptsWithin = turf.within(filtered, HDBbuffered);

    ptsWithin.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
        HDBbuffered.features.push(currentPoint)
        // objectSend.buffer = HDBbuffered;
        // objectSend.points = ptsWithin;
    var requirement = {};
    requirement["requirement_description"] = ORrequirement;
    requirement["requirement_points"] = ptsWithin;
    var numberofPoints = ptsWithin.features.length;
    var operator = ORrequirement.operator;
    var operator_amt = ORrequirement.operator_amt;

    if (operator === "≥") {
        if (numberofPoints >= operator_amt) {
            requirement["requirement_result"] = true;
        } else {
            requirement["requirement_result"] = false;
        }
    } else if (operator === "≤") {
        if (numberofPoints <= operator_amt) {
            requirement["requirement_result"] = true;
        } else {
            requirement["requirement_result"] = false;
        }
    } else {
        if (numberofPoints === operator_amt) {
            requirement["requirement_result"] = true;
        } else {
            requirement["requirement_result"] = false;
        }
    }
    // currentPoint["requirements"] = requirement
    return requirement;

}

function calculateBufferBackup(aHDB, ORrequirement, lengthOfRequirements, lengthofHDBfile) {
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
    var distanceTranslated = distance / 1000;
    var HDBbuffered = turf.buffer(currentPoint, distanceTranslated, unit);
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
        var filtered = {}
        var key = ORrequirement.sublayer_column;
        if (key != 'N/A') {
            var value = ORrequirement.subLayer;
            filtered = turf.filter(layerRequest, key, value);
            // console.log(value);
            // Check Buffer Point Within
        } else {
            filtered = layerRequest;
        }
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

        if (operator === "≥") {
            if (numberofPoints >= operator_amt) {
                requirement["requirement_result"] = true;
            } else {
                requirement["requirement_result"] = false;
            }
        } else if (operator === "≤") {
            if (numberofPoints <= operator_amt) {
                requirement["requirement_result"] = true;
            } else {
                requirement["requirement_result"] = false;
            }
        } else {
            if (numberofPoints === operator_amt) {
                requirement["requirement_result"] = true;
            } else {
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
            HDB["HDB_JSON"] = currentPoint;
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

            for (var i = 0; i < HDBArray.length; i++) {

                var oneHDB = HDBArray[i];
                // console.log(oneHDB);
                var ORREquirementArray = oneHDB.ORREquirement;
                var evaluationArray = [];
                for (var m = 0; m < ORREquirementArray.length; m++) {
                    var evaluation = ORREquirementArray[m].requirement_result;
                    evaluationArray.push(evaluation);
                }

                var totalEvaluation = _.uniq(evaluationArray);
                // console.log(evaluationArray);

                if (totalEvaluation.length > 1) {
                    HDBArray[i]["totalRequirement"] = true;
                } else {
                    if (totalEvaluation[0] === true) {
                        HDBArray[i]["totalRequirement"] = true;
                    } else {
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
    var objectReceivedArray = req.body;

    // console.log(JSON.stringify(objectReceived));
    // console.log(objectReceivedArray.length);
    // console.log(objectReceivedArray.length);

    for (var m = 0; m < objectReceivedArray.length; m++) {
        var objectReceived = objectReceivedArray[m];
        geoHDBPoint(objectReceived, objectReceivedArray.length);
    }


    res.redirect("/");


})

function geoHDBPoint(objectReceived, lengthOfRequest) {

    // console.log(JSON.stringify(objectReceived));
    // var lengthOfRequest = objectReceived.length;

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
}
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
        if (aName != ".DS_Store") {


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
    }
    res.send(objectsSend);
});

//get coordinate  for postal code
app.get('/getPostalCode/:postalcode', function(req, res) {
    var postcode = req.params.postalcode;
    var coordinates;

    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";
    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            // console.log(data);
            var search_result = data.SearchResults;
            if (search_result[0].hasOwnProperty("ErrorMessage")) {
                coordinates = {};
                coordinates["postalcode"] = postcode;

            } else {
                var X = data.SearchResults[1].X; // Show the HTML for the Google homepage.
                var Y = data.SearchResults[1].Y;
                coordinates = "[" + X + "," + Y + "]";
            }
            // console.log(coordinates);
            // console.log(typeof coordinates)
            res.send(coordinates);

        }

    });
})

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

app.get("/getNumberofHDB2/:fileIndexes", function(req, res) {
    var fileIndexesStr = req.params.fileIndexes;
    var fileIndexes = [];
    if (fileIndexesStr.indexOf(';') != -1) {
        fileIndexes = fileIndexesStr.split(';');
    } else {
        fileIndexes.push(fileIndexesStr);
    }
    var path = __dirname + '/app' + '/ORResults';
    var name = fs.readdirSync(path);
    if (name[0] === '.DS_Store') {
        name.splice(0, 1);
    }
    var directories = [];
    var results = [];
    for (var i = 0; i < name.length; i++) {
        aName = name[i];

        if (aName != ".DS_Store") {

            if (fileIndexes.indexOf(String(i + 1)) != -1) {
                url = __dirname + "/app/ORResults/" + aName;
                url = url.replace("\\", "/");
                directories.push(url);
                var fileData = fs.readFileSync(url, "utf8");
                data = JSON.parse(fileData);
                var tempArray = [];
                for (index in data) {
                    delete data[index].HDB_details
                    tempArray.push(data[index]);
                }
                results.push(tempArray);
            }
        }
    }
    for (index in results) {
        var elementCopy = results[index];
        delete results[index];
        var reqObject = {
            "bigORs": elementCopy,
            "directory": directories[index]
        };
        results[index] = reqObject;
    }
    res.send(results);
});

app.get("/getNumberofHDB", function(req, res) {
    var path = __dirname + '/app' + '/ORResults';
    var name = fs.readdirSync(path);
    var directories = [];
    var results = [];
    for (var i = 0; i < name.length; i++) {
        aName = name[i];
        if (aName != ".DS_Store") {
            url = __dirname + "/app/ORResults/" + aName;
            url = url.replace("\\", "/");
            directories.push(url);
            // console.log(url);
            var fileData = fs.readFileSync(url, "utf8");
            data = JSON.parse(fileData);
            // data.forEach(function(element,index){
            //     console.log(JSON.stringify(element));
            // })
            var tempArray = [];
            for (index in data) {
                // console.log(index);
                delete data[index].HDB_details
                tempArray.push(data[index]);
            }
            // console.log(tempArray);
            results.push(tempArray);
        }
    }

    for (index in results) {
        var elementCopy = results[index];
        delete results[index];
        var reqObject = {
            "bigORs": elementCopy,
            "directory": directories[index]
        };
        results[index] = reqObject;
    }

    res.send(results);
});


// var planingArea = fs.readFile(urlPlaningAreas, "utf8", function(err, PlaningArea) {
// var testPark = {"type":"FeatureCollection","crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::3414"}},"features":[{"type":"Feature","properties":{"Feb-16":"Jurong West Park","x-coordinates":"12492.80991","y-coordinates":"36410.64494"},"geometry":{"type":"Point","coordinates":[103.69397709273666,1.3455554561200045]}},{"type":"Feature","properties":{"Feb-16":"Chinese Garden Park","x-coordinates":"16600.20708","y-coordinates":"35684.29778"},"geometry":{"type":"Point","coordinates":[103.73088476827687,1.3389884814852058]}},{"type":"Feature","properties":{"Feb-16":"Yunnan Park","x-coordinates":"12349.96762","y-coordinates":"35512.79393"},"geometry":{"type":"Point","coordinates":[103.69269403453349,1.3374355608317607]}},{"type":"Feature","properties":{"Feb-16":"Jalan Bahar Mini Park","x-coordinates":"13709.2759","y-coordinates":"36934.22045"},"geometry":{"type":"Point","coordinates":[103.70490750844554,1.3502910786217523]}},{"type":"Feature","properties":{"Feb-16":"Taman Jurong Greens","x-coordinates":"15230.37874","y-coordinates":"35463.38927"},"geometry":{"type":"Point","coordinates":[103.71857616752038,1.336990118610859]}},{"type":"Feature","properties":{"Feb-16":"Firefly Park @ Clementi","x-coordinates":"20390.13986","y-coordinates":"33604.19211"},"geometry":{"type":"Point","coordinates":[103.76494002958339,1.32017794999254]}},{"type":"Feature","properties":{"Feb-16":"Clementi Woods Park","x-coordinates":"20711.35687","y-coordinates":"31395.50302"},"geometry":{"type":"Point","coordinates":[103.76782684893212,1.3002034362358188]}},{"type":"Feature","properties":{"Feb-16":"West Coast Park","x-coordinates":"20135.3512","y-coordinates":"31100.7682"},"geometry":{"type":"Point","coordinates":[103.76265125603057,1.297537819801672]}},{"type":"Feature","properties":{"Feb-16":"Our Park @ 618 Ang Mo Kio","x-coordinates":"28469.4804","y-coordinates":"39998.12307"},"geometry":{"type":"Point","coordinates":[103.8375372048229,1.3780033308888866]}},{"type":"Feature","properties":{"Feb-16":"Bishan Ang Mo Kio Park","x-coordinates":"29338.79883","y-coordinates":"38343.43232"},"geometry":{"type":"Point","coordinates":[103.84534859447591,1.3630388723407072]}},{"type":"Feature","properties":{"Feb-16":"Leban Park","x-coordinates":"27570.99088","y-coordinates":"39374.08927"},"geometry":{"type":"Point","coordinates":[103.82946362594411,1.3723597928977918]}},{"type":"Feature","properties":{"Feb-16":"Ang Mo Kio Town Garden West","x-coordinates":"29249.40681","y-coordinates":"39644.01981"},"geometry":{"type":"Point","coordinates":[103.84454540118476,1.374800924884806]}},{"type":"Feature","properties":{"Feb-16":"Tavistock Avenue Park","x-coordinates":"31562.97794","y-coordinates":"39116.88644"},"geometry":{"type":"Point","coordinates":[103.86533444362597,1.3700335304858187]}},{"type":"Feature","properties":{"Feb-16":"Jalan Pintau Playground Park","x-coordinates":"28742.4759","y-coordinates":"37328.49211"},"geometry":{"type":"Point","coordinates":[103.83999020336404,1.3538601356390618]}},{"type":"Feature","properties":{"Feb-16":"Teck Ghee N4 Park","x-coordinates":"30921.19938","y-coordinates":"38915.87221"},"geometry":{"type":"Point","coordinates":[103.85956759219768,1.3682157002814592]}},{"type":"Feature","properties":{"Feb-16":"Yishun Neighbourhood Park","x-coordinates":"28269.94532","y-coordinates":"46572.34879"},"geometry":{"type":"Point","coordinates":[103.83574429670982,1.4374582637230267]}},{"type":"Feature","properties":{"Feb-16":"Lower Seletar Reservoir Park","x-coordinates":"27876.08157","y-coordinates":"43508.46762"},"geometry":{"type":"Point","coordinates":[103.83220506557852,1.4097496303561263]}},{"type":"Feature","properties":{"Feb-16":"Sembawang Park","x-coordinates":"28351.81","y-coordinates":"49195.37"},"geometry":{"type":"Point","coordinates":[103.83647996233445,1.4611799135987107]}},{"type":"Feature","properties":{"Feb-16":"Yishun Park","x-coordinates":"28965.87962","y-coordinates":"45064.86637"},"geometry":{"type":"Point","coordinates":[103.84199788454895,1.4238251230770615]}},{"type":"Feature","properties":{"Feb-16":"Bukit Purmei Hillock Park","x-coordinates":"26967.65323","y-coordinates":"28494.23521"},"geometry":{"type":"Point","coordinates":[103.82404257304594,1.2739662270030678]}},{"type":"Feature","properties":{"Feb-16":"Telok Blangah Hill Park","x-coordinates":"25674.64021","y-coordinates":"29046.56685"},"geometry":{"type":"Point","coordinates":[103.81242434691549,1.2789612520244928]}},{"type":"Feature","properties":{"Feb-16":"Tiong Bahru Park","x-coordinates":"27037.61275","y-coordinates":"30003.87671"},"geometry":{"type":"Point","coordinates":[103.82467113860378,1.287618897492641]}},{"type":"Feature","properties":{"Feb-16":"Green Oval Park @ Pasir Ris","x-coordinates":"39581.75104","y-coordinates":"40372.42548"},"geometry":{"type":"Point","coordinates":[103.93738920419504,1.381386099103072]}},{"type":"Feature","properties":{"Feb-16":"Pasir Ris Park","x-coordinates":"40694.13589","y-coordinates":"40489.16977"},"geometry":{"type":"Point","coordinates":[103.94738484498052,1.3824414289557245]}},{"type":"Feature","properties":{"Feb-16":"Aljunied Park","x-coordinates":"33269.75179","y-coordinates":"34611.78927"},"geometry":{"type":"Point","coordinates":[103.88067021738051,1.3292907922421822]}},{"type":"Feature","properties":{"Feb-16":"East Coast Park ","x-coordinates":"36032.98191","y-coordinates":"31254.53902"},"geometry":{"type":"Point","coordinates":[103.90549848801714,1.2989284257493996]}},{"type":"Feature","properties":{"Feb-16":"Telok Kurau Park","x-coordinates":"37011.95141","y-coordinates":"33053.63927"},"geometry":{"type":"Point","coordinates":[103.9142954790845,1.3151985697204247]}},{"type":"Feature","properties":{"Feb-16":"Compassvale Ancilla Park","x-coordinates":"34580.85564","y-coordinates":"40687.54211"},"geometry":{"type":"Point","coordinates":[103.8924525416005,1.38423745206866]}},{"type":"Feature","properties":{"Feb-16":"Sengkang Riverside Park","x-coordinates":"34065.61718","y-coordinates":"42377.87737"},"geometry":{"type":"Point","coordinates":[103.88782308687469,1.3995243422853743]}},{"type":"Feature","properties":{"Feb-16":"Serangoon Community Park","x-coordinates":"32314.8504","y-coordinates":"37594.01762"},"geometry":{"type":"Point","coordinates":[103.8720903257826,1.3562611507526174]}},{"type":"Feature","properties":{"Feb-16":"Surin Avenue Neighbourhood Park ","x-coordinates":"33652.20141","y-coordinates":"37489.67045"},"geometry":{"type":"Point","coordinates":[103.88410727496378,1.3553172488144036]}},{"type":"Feature","properties":{"Feb-16":"Tai Keng Gardens Playground Park","x-coordinates":"33764.63804","y-coordinates":"36509.58521"},"geometry":{"type":"Point","coordinates":[103.88511740309649,1.3464536886420813]}},{"type":"Feature","properties":{"Feb-16":"Kampong Park @ Serangoon","x-coordinates":"31858.82692","y-coordinates":"37162.58644"},"geometry":{"type":"Point","coordinates":[103.8679926023026,1.3523595039900236]}},{"type":"Feature","properties":{"Feb-16":"Serangoon Sunshine Park","x-coordinates":"32465.00708","y-coordinates":"36579.08644"},"geometry":{"type":"Point","coordinates":[103.8734394307473,1.3470824543776054]}},{"type":"Feature","properties":{"Feb-16":"Mandai Tekong Park","x-coordinates":"23606.12874","y-coordinates":"46293.58644"},"geometry":{"type":"Point","coordinates":[103.79383546563612,1.4349368961854605]}},{"type":"Feature","properties":{"Feb-16":"Circle Green Park","x-coordinates":"24052.08441","y-coordinates":"47213.23644"},"geometry":{"type":"Point","coordinates":[103.79784267242503,1.443253941889533]}},{"type":"Feature","properties":{"Feb-16":"Woodlands Crescent Park","x-coordinates":"24732.64264","y-coordinates":"47391.4859"},"geometry":{"type":"Point","coordinates":[103.8039581364304,1.4448660528548893]}},{"type":"Feature","properties":{"Feb-16":"Woodlands Waterfront Park","x-coordinates":"22131.37628","y-coordinates":"48272.27954"},"geometry":{"type":"Point","coordinates":[103.78058300279623,1.452831202035946]}},{"type":"Feature","properties":{"Feb-16":"Bukit Batok Nature Park","x-coordinates":"20320.29246","y-coordinates":"36881.02527"},"geometry":{"type":"Point","coordinates":[103.76431158830921,1.3498124282754906]}},{"type":"Feature","properties":{"Feb-16":"Beauty Garden Park","x-coordinates":"18579.20649","y-coordinates":"38233.18398"},"geometry":{"type":"Point","coordinates":[103.74866642403869,1.3620403592663366]}},{"type":"Feature","properties":{"Feb-16":"Punggol Park","x-coordinates":"35181.52336","y-coordinates":"39707.6287"},"geometry":{"type":"Point","coordinates":[103.89784975420181,1.3753753299581015]}},{"type":"Feature","properties":{"Feb-16":"Holland Village Park","x-coordinates":"23820.27311","y-coordinates":"32623.63817"},"geometry":{"type":"Point","coordinates":[103.79576168646363,1.3113108292240072]}},{"type":"Feature","properties":{"Feb-16":"Jalan Pari Burong Playground Park","x-coordinates":"40671.62387","y-coordinates":"35138.28237"},"geometry":{"type":"Point","coordinates":[103.94718029336944,1.334050015556146]}},{"type":"Feature","properties":{"Feb-16":"Tampines Tree Park","x-coordinates":"41946.30628","y-coordinates":"37066.93296"},"geometry":{"type":"Point","coordinates":[103.95863490703655,1.3514914445366264]}},{"type":"Feature","properties":{"Feb-16":"Tampines Central Park","x-coordinates":"39554.49858","y-coordinates":"37347.13521"},"geometry":{"type":"Point","coordinates":[103.93714314527725,1.354026509822595]}},{"type":"Feature","properties":{"Feb-16":"Bedok Resevoir Park","x-coordinates":"39176.53947","y-coordinates":"35697.54847"},"geometry":{"type":"Point","coordinates":[103.93374633382489,1.3391084005897191]}},{"type":"Feature","properties":{"Feb-16":"Sun Plaza Park (Tampines)","x-coordinates":"40291.96","y-coordinates":"37902.64"},"geometry":{"type":"Point","coordinates":[103.94376992797422,1.3590499932684552]}},{"type":"Feature","properties":{"Feb-16":"Bougainvillea Park","x-coordinates":"25134.28259","y-coordinates":"34310.73644"},"geometry":{"type":"Point","coordinates":[103.80756854714663,1.3265684986077761]}},{"type":"Feature","properties":{"Feb-16":"Choa Chu Kang Park","x-coordinates":"18415.16807","y-coordinates":"41074.62598"},"geometry":{"type":"Point","coordinates":[103.74719150875676,1.3877372630616642]}},{"type":"Feature","properties":{"Feb-16":"Toa Payoh Town Park","x-coordinates":"29643.00072","y-coordinates":"34731.64644"},"geometry":{"type":"Point","coordinates":[103.84808185840946,1.3303751502512366]}}]}
// var PlaningAreaJSON = JSON.parse(PlaningArea);
// var ptsWithin = turf.within(HDBpolygons, PlaningAreaJSON);
// var resultFeatures = PlaningAreaJSON.features.concat(HDBpolygons.features);
// var result = {
//     "type": "FeatureCollection",
//     "features": resultFeatures
// };
// // console.log(JSON.stringify(result));
// urlDestination = globalurl + "/PlanningArea/Result.geojson"
// fs.writeFile(urlDestination, JSON.stringify(result), function(err) {
//     if (err) {
//         return console.log(err);

//     }
// });

// console.log(JSON.stringify(withins));
// var aggregated = turf.sum(PlaningAreaJSON, HDBpolygons, 'DwellingUnits', 'sum');
// var resultFeatures = HDBpolygons.features.concat(
//     aggregated.features);
// var result = {
//     "type": "FeatureCollection",
//     "features": resultFeatures
// };
// urlDestination = globalurl + "/PlanningArea/Result.geojson"

// fs.writeFile(urlDestination, JSON.stringify(result), function(err) {
//     if (err) {
//         return console.log(err);

//     }
// });

// })

app.post("/getHexbinVisualGeojson", function(req, res) {
    // var kpiName = req.params.name + ".geojson";
    // var url = globalurl + "/FinalResult/" + kpiName;
    // url = url.replace("\\", "/");

    var dataJSON = req.body;

    // console.log(dataJSON);
    var successfulHDBs = dataJSON.reqFinal.success_HDB_JSONs;
    var HDBpoints = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var m = 0; m < successfulHDBs.length; m++) {
        HDBpoints.features.push(successfulHDBs[m]);
    }

    var bbox = [103.597500, 1.201023, 104.067218, 1.490837]
    var cellWidth = 2;
    var units = 'kilometers';

    var hexgrid = turf.hexGrid(bbox, cellWidth, units);
    var counted = turf.count(hexgrid, HDBpoints, 'pt_count');

    var resultFeatures = HDBpoints.features.concat(counted.features);
    var result = {
        "points": HDBpoints,
        "counted": counted
    };
    res.send(result);

})

app.post("/getHexbinContainHDBs", function(req, res) {
    var HexbinReceivedJSON = req.body;
    var searchWithin = {
        "type": "FeatureCollection",
        "features": []
    };
    searchWithin.features.push(HexbinReceivedJSON);
    // var HexbinReceivedJSON = JSON.parse(HexbinReceived);
    var nameHDB = HexbinReceivedJSON.kpiName;
    // console.log(nameHDB)
    var url = globalurl + "/FinalResult/" + nameHDB + ".geojson";
    console.log(url)
    fs.readFile(url, "utf8", function(err, data) {
        // console.log(data)
        var dataJSON = JSON.parse(data);
        var requirementDirectory = dataJSON.reqData;
        var requirements = [];
        for (var i = 0; i < requirementDirectory.length; i++) {
            var url = requirementDirectory[i].directory;
            var afile = JSON.parse(fs.readFileSync(url, "utf8"));
            // console.log(afile);
            var requirementOR = afile[0].ORREquirement;
            for (var n = 0; n < requirementOR.length; n++) {
                requirements.push(requirementOR[n].requirement_description);
            }
        }
        // console.log(requirements);
        //         // console.log(dataJSON)
        var successfulHDBs = dataJSON.reqFinal.success_HDB_JSONs;
        // console.log(resultBuffer);
        var HDBpoints = {
            "type": "FeatureCollection",
            "features": []
        };
        for (var m = 0; m < successfulHDBs.length; m++) {
            HDBpoints.features.push(successfulHDBs[m]);
        }
        var ptsWithin = turf.within(HDBpoints, searchWithin);
        var HDBFeatures = [];
        for (var point in ptsWithin.features) {
            HDBFeatures.push(ptsWithin.features[point]);
        }
        // console.log(HDBFeatures);
        var resultBuffer = CalculateFacilitiesHexbin(HDBFeatures, requirements);
        // console.log(resultBuffer);
        // HDB = ptsWithin;
        // CalculateFacilities()
        // var resultHDB = searchWithin.features.concat(ptsWithin.features);
        // console.log(JSON.stringify(resultBuffer))
        var result = {
            "hexbin": searchWithin,
            "HDBPoints": resultBuffer
        };

        res.send(result);

    });
})

function CalculateFacilitiesHexbin(HDB, objectReceived) {
    // console.log(JSON.stringify(HDB));

    var HDBArray = [];
     var HDBpoints = {
            "type": "FeatureCollection",
            "features": []
        };
    var HDBObject = {};
    for (var m = 0; m < HDB.length; m++) {
         var aHDB = HDB[m];
         var count = 0;
        for (var i = 0; i < objectReceived.length; i++) {

            var ORrequirementSend = objectReceived[i];
            // console.log(ORrequirement);
            var urlLayerRetrieved = globalurl + "/geojson/" + ORrequirementSend.parentLayer + ".geojson";
            var layerRequest = JSON.parse(fs.readFileSync(urlLayerRetrieved));
            var numbercount = calculateBufferHexbin(aHDB, layerRequest, ORrequirementSend);
            // console.log("index: " + m + " :" + numbercount);
            count += numbercount;
        }
        aHDB.properties["pt_count"] =count;
        HDBpoints.features.push(aHDB);
        // HDBArray.push(HDBObject);

    }


    // var path = globalurl + "/ORResults/";
    // var name = fs.readdirSync(path);
    // // console.log(name);
    // var rowCount = name.length;
    // // console.log("first" + rowCount);
    // for (var i = 0; i < name.length; i++) {
    //     if (name[i] === ".DS_Store") {
    //         rowCount = rowCount - 1;
    //     }

    // }

    // // console.log("before" + rowCount);
    // if (rowCount > 0) {
    //     var lastName = name[name.length - 1];
    //     // console.log(lastName);
    //     var LastNameExceptJSONextension = lastName.split(".")[0];
    //     var lastChar = LastNameExceptJSONextension.substr(LastNameExceptJSONextension.length - 1);
    //     // console.log(lastChar);
    //     rowCount = parseInt(lastChar) + 1;
    // }
    // // console.log("after" + rowCount);

    // var ANDREquirementNameFile = "ORresult" + rowCount;
    // var urlDestination = globalurl + "/ORResults/" + ANDREquirementNameFile + ".json";
    // for (var i = 0; i < HDBArray.length; i++) {

    //     var oneHDB = HDBArray[i];
    //     // console.log(oneHDB);
    //     var ORREquirementArray = oneHDB.ORREquirement;
    //     var evaluationArray = [];
    //     for (var m = 0; m < ORREquirementArray.length; m++) {
    //         var evaluation = ORREquirementArray[m].requirement_result;
    //         evaluationArray.push(evaluation);
    //     }

    //     var totalEvaluation = _.uniq(evaluationArray);
    //     // console.log(evaluationArray);

    //     if (totalEvaluation.length > 1) {
    //         HDBArray[i]["totalRequirement"] = true;
    //     } else {
    //         if (totalEvaluation[0] === true) {
    //             HDBArray[i]["totalRequirement"] = true;
    //         } else {
    //             HDBArray[i]["totalRequirement"] = false;
    //         }
    //     }

    // }

    return HDBpoints;

}

function calculateBufferHexbin(aHDB, layerRequest, ORrequirement) {
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
    var distanceTranslated = distance / 1000;
    var HDBbuffered = turf.buffer(currentPoint, distanceTranslated, unit);
    HDBbuffered.features[0].properties = {
        "fill": "#6BC65F",
        "stroke": "#25561F",
        "stroke-width": 2
    };
    HDBbuffered.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
        urlLayerRetrieved = globalurl + "/geojson/" + ORrequirement.parentLayer + ".geojson";
    var filtered = {}
    var key = ORrequirement.sublayer_column;
    if (key != 'N/A') {
        var value = ORrequirement.subLayer;
        filtered = turf.filter(layerRequest, key, value);
        // console.log(value);
        // Check Buffer Point Within
    } else {
        filtered = layerRequest;
    }
    // var ptsWithin = turf.within(filtered, HDBbuffered);
    var counted = turf.count(HDBbuffered, filtered, 'pt_count');
    // ptsWithin.csr = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
    var countNumber = counted.features[0].properties.pt_count;
    return countNumber;

}

app.post('/getHexbinContainHDBs', function(req, res) {
    var HDB = req.body;
    //ken modify from here
})

app.listen(3000);
console.log("Running at Port 3000");
