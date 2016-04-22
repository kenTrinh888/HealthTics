var express = require("express");
var http = require("http");
var app = express();
var request = require('request');
// var hyperquest = require('hyperquest');
var re = require('request-enhanced');
// var requestSync = require('urllib-sync').request;
var requestSync = require('sync-request');

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
// var requestSync = require('sync-request');

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
            } else {
                res.send("success");
            }
        });

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
    res.redirect('/');

});

app.post('/deleteKPIFile', function(req, res) {
    fileToDelete = req.body;
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    var kpiFileName = fileToDelete.kpiName + ".geojson";
    var fullKPIFilePath = folderDestination + kpiFileName;
    console.log(fullKPIFilePath);
    fs.unlinkSync(fullKPIFilePath);
    res.redirect('/');
});

//don't care about this one below
app.post('/sendModifiedRequirements', function(req, res) {
    //ken modify from here
    var requirements = req.body;
    // console.log(requirements);
    var AndTableCombineURL = globalurl + "/ANDResult/ANDResult.json";
    fs.writeFile(AndTableCombineURL, JSON.stringify(requirements), function(err) {
        if (err) {
            return console.log(err);
        }
    });
    res.send("success")
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

    res.send("KPI improve successful");
})

app.get('/getAllKPIs', function(req, res) {
    var existingKPIFiles = [];
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    existingKPIFiles = fs.readdirSync(folderDestination);
    // console.log(existingKPIFiles);
    var KPIJsons = [];
    existingKPIFiles.forEach(function(kpiFile, index) {
        if (kpiFile !== ".DS_Store") {
            var KPIUrl = folderDestination + kpiFile;
            // console.log(KPIUrl);
            var KPIData = fs.readFileSync(KPIUrl);
            var KPIJson = JSON.parse(KPIData);
            KPIJsons.push(KPIJson);
        }

    })
    res.send(KPIJsons);
})

app.post('/submitFilter', function(req, res) {
    objectReceived = setFilterTableData(req.body); //transform data to the preferred geojson format
    var url = globalurl + "/HDB/HDB.json";
    var HDB = JSON.parse(fs.readFileSync(url, "utf8"));
    CalculateFacilities(HDB, objectReceived, "None");
    res.redirect("/");


});

function CalculateFacilities(HDB, objectReceived, nameOfFile) {
    console.log(objectReceived);
    var HDBArray = [];
    var HDBObject = {};
    for (var i = 0; i < objectReceived.length; i++) {
        var ORrequirementSend = objectReceived[i];
        var urlLayerRetrieved = globalurl + "/geojson/" + ORrequirementSend.parentLayer + ".geojson";
        var layerRequest = fs.readFileSync(urlLayerRetrieved, { encoding: 'utf8' });
        for (var m = 0; m < HDB.length; m++) {

            var aHDB = HDB[m];

            var requirementReturns = calculateBuffer(aHDB, JSON.parse(layerRequest), ORrequirementSend);
            HDBObject = { "ORREquirement": [], "HDB_JSON": aHDB }
            if (HDBArray[m] == null) {
                HDBObject.ORREquirement.push(requirementReturns);
                HDBArray[m] = HDBObject;
            } else {
                HDBArray[m].ORREquirement.push(requirementReturns);
            }
        }

    }
    var path = globalurl + "/ORResults/";
    var name = fs.readdirSync(path);
    var rowCount = name.length;
    for (var i = 0; i < name.length; i++) {
        if (name[i] === ".DS_Store") {
            rowCount = rowCount - 1;
        }
    }
    if (rowCount > 0) {
        var lastName = name[name.length - 1];
        // console.log(lastName);
        var LastNameExceptJSONextension = lastName.split(".")[0];
        var lastChar = LastNameExceptJSONextension.substr(LastNameExceptJSONextension.length - 1);
        // console.log(lastChar);
        rowCount = parseInt(lastChar) + 1;
    }
    var ANDREquirementNameFile;
    var urlDestination;
    var nameExist = false;
    for (var m in name) {
        var fileName = name[m];
        if (nameOfFile === fileName) {
            nameExist = true;
        }
    }
    if (nameExist) {
        console.log("define" + typeof nameofFile);
        ANDREquirementNameFile = nameOfFile;
        urlDestination = globalurl + "/ORResults/" + ANDREquirementNameFile;

    } else {
        console.log("undefine" + typeof nameofFile);
        ANDREquirementNameFile = "ORresult" + rowCount;
        urlDestination = globalurl + "/ORResults/" + ANDREquirementNameFile + ".json";
    }

    console.log(urlDestination);
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

    })
    // ======================

function rmDirInvalid(dirPath, name) {
    try {
        var files = fs.readdirSync(dirPath);

    } catch (e) {
        return;
    }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            if (files[i] === name) {
                var filePath = dirPath + '/' + files[i];
                if (fs.statSync(filePath).isFile())
                    fs.unlinkSync(filePath);
                else
                    rmDir(filePath);
            }
        }
};

app.post('/findPostalCode', function(req, res) {
    var objectReceivedArray = req.body;
    var postalcodeArray = []
    var postalCodeGeo = []
    var lengthOfRequest = objectReceivedArray.length;
    for (var m = 0; m < objectReceivedArray.length; m++) {
        var objectReceived = objectReceivedArray[m];
        geoCode(objectReceived, lengthOfRequest);
    }

    // res.send("/")

})

function geoCode(objectReceived, lengthOfRequest) {
    leafletFeatures = [];
    InvalidHDBsArray = [];
    // var lengthOfRequest = objectReceived.length;
    var postcode = String(objectReceived.POSTCODE);


    // console.log("id " + postcode);
    if (postcode.length < 6) {
        postcode = "0" + postcode;
    }
    var urlString = "http://www.onemap.sg/APIV2/services.svc/basicSearchV2?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&projSys=WGS84";

    re.get(urlString, function(error, data) {
        // console.log('Fetched:', data);
        if (typeof data != "undefined") {
            var geocodedDataJson = JSON.parse(data);
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
                    // console.log(objectReceived);
                    leafletFeatures.push(leafletFeature);
                    var lengthOfHDB = leafletFeatures.length + InvalidHDBsArray.length;

                    console.log("length of uploading: " + lengthOfHDB + " " + lengthOfRequest);
                    if (lengthOfRequest === lengthOfHDB) {
                        // console.log(JSON.stringify(leafletFeatures));
                        var urlDestination = globalurl + "/HDB/HDB.json";
                        fs.writeFile(urlDestination, JSON.stringify(leafletFeatures), function(err) {
                            if (err) {
                                console.error('There was an error writing the file!', err);
                                return;
                            }
                        });

                    }
                }

            } else {
                console.log(objectReceived);
                InvalidHDBsArray.push(objectReceived);
            }
        } else {
            console.log(error);
        }
    })

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
process.on('uncaughtException', (err) => {
    console.log(`Caught exception: ${err}`);
});

setTimeout(() => {
    console.log('This will still run.');
}, 500);
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
//getAllLayerName
app.get('/getAllLayerName', function(req, res) {
    var path = __dirname + '/app' + '/geojson/';
    var name = fs.readdirSync(path);
    var objectsSend = [];
    for (var i = 0; i < name.length; i++) {
        var aName = name[i];
        if (aName != ".DS_Store") {
            objectsSend.push(aName);
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


app.post("/getHexbinVisualGeojson", function(req, res) {
    var dataJSON = req.body;
    var cellWidth;
    var hexbinWidth = dataJSON.hexbinWidth;
    console.log(hexbinWidth);
    // console.log(JSON.stringify(dataJSON));
    var HDBchoice = dataJSON.HDBchoice;
    var successfulHDBs;

    if (typeof hexbinWidth === "undefined") {
        cellWidth = 2
    } else {
        cellWidth = hexbinWidth;
    }

    if (typeof HDBchoice === "undefined" || HDBchoice === "Successful") {
        // console.log(JSON.stringify("successful"));
        successfulHDBs = dataJSON.reqFinal.success_HDB_JSONs;
    } else {
        // console.log(JSON.stringify("fail"));
        successfulHDBs = dataJSON.andTable[0].failed_HDB_JSONs;

    }

    // console.log(dataJSON);
    var HDBpoints = {
        "type": "FeatureCollection",
        "features": []
    };
    for (var m = 0; m < successfulHDBs.length; m++) {
        HDBpoints.features.push(successfulHDBs[m]);
        // console.log()
    }
    // console.log(HDBpoints);
    var bbox = [103.597500, 1.201023, 104.067218, 1.490837]

    var units = 'kilometers';
    var url = globalurl + "/PlanningArea/SGCoastLine.geojson";
    var SingaporeZone = JSON.parse(fs.readFileSync(url, "utf8"));


    var hexgrid = turf.hexGrid(bbox, cellWidth, units);
    // var intersection = turf.intersect(hexgrid, SingaporeZone);
    // console.log(JSON.stringify(SingaporeZone));
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
    // console.log(JSON.stringify(HexbinReceivedJSON));
    // console.log(HexbinReceivedJSON);
    var searchWithin = {
        "type": "FeatureCollection",
        "features": []
    };
    searchWithin.features.push(HexbinReceivedJSON);

    var nameHDB = HexbinReceivedJSON.kpiName;
    var url = globalurl + "/FinalResult/" + nameHDB + ".geojson";
    var data = fs.readFileSync(url, "utf8");
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
    var HDBchoice = HexbinReceivedJSON.HDBoption;
    if (typeof HDBchoice === "undefined" || HDBchoice === "Successful") {
        // console.log(JSON.stringify("successful"));
        successfulHDBs = dataJSON.reqFinal.success_HDB_JSONs;
    } else {
        // console.log(JSON.stringify("fail"));
        successfulHDBs = dataJSON.andTable[0].failed_HDB_JSONs;

    }
    // var successfulHDBs = dataJSON.reqFinal.success_HDB_JSONs;
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


})

function CalculateFacilitiesHexbin(HDB, objectReceived) {
    var HDBArray = [];
    var HDBpoints = {
        "type": "FeatureCollection",
        "features": []
    };
    var HDBObject = {};
    for (var m = 0; m < HDB.length; m++) {
        var facilities = [];
        var analysisArray = [];
        var aHDB = HDB[m];
        var count = 0;
        for (var i = 0; i < objectReceived.length; i++) {
            var ORrequirementSend = objectReceived[i];
            // console.log(ORrequirement);
            var urlLayerRetrieved = globalurl + "/geojson/" + ORrequirementSend.parentLayer + ".geojson";
            var layerRequest = JSON.parse(fs.readFileSync(urlLayerRetrieved));
            var objectReturn = calculateBufferHexbin(aHDB, layerRequest, ORrequirementSend);
            var ptsWithin = objectReturn.ptsWithin;
            var analysis = objectReturn.analysis;
            analysisArray.push(analysis);
            facilities.push(ptsWithin)
            var numbercount = ptsWithin.features.length;
            count += numbercount;
        }
        aHDB.properties["pt_count"] = count;
        aHDB.properties["facilities"] = facilities;
        aHDB.properties["requirements"] = objectReceived;
        aHDB.properties["analysis"] = analysisArray;
        HDBpoints.features.push(aHDB);

    }
    return HDBpoints;

}

function calculateBufferHexbin(aHDB, layerRequest, ORrequirement) {
    var analysis = "Facility: " + "<b>" + ORrequirement.parentLayer + "</b>";
    var objectReturn = {};
    var difference;
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
        analysis += " and Category : " + "<b>" + value + "</b>";
        filtered = turf.filter(layerRequest, key, value);
        // console.log(value);
        // Check Buffer Point Within
    } else {
        filtered = layerRequest;
    }
    // var counted = turf.count(HDBbuffered, filtered, 'pt_count');
    var ptsWithin = turf.within(filtered, HDBbuffered);

    //Running Analysis
    var numberofPoints = ptsWithin.features.length;
    var operator = ORrequirement.operator;
    var operator_amt = ORrequirement.operator_amt;


    objectReturn.ptsWithin = ptsWithin;
    if (operator === "≥") {
        if (numberofPoints >= operator_amt) {
            analysis += " : Fullfiled";
        } else {
            difference = operator_amt - numberofPoints;
            analysis += " need <b>" + difference + "</b> more facilities within " + distance + " meter";
        }
    } else if (operator === "≤") {
        if (numberofPoints <= operator_amt) {
            analysis += " : Fullfiled";
        } else {
            difference = numberofPoints - operator_amt;
            analysis += " need <b>" + difference + "</b>less facilities within " + distance + " meter";

        }
    } else {
        if (numberofPoints === operator_amt) {
            analysis += ": Fullfiled";
        } else {

            analysis += " the difference is <b>" + difference + " </b>facilities within " + distance + " meter";
        }
    }

    objectReturn.analysis = analysis;
    return objectReturn;

}



app.post('/getBulletChartJson', function(req, res) {
    var bulletChartJson = req.body;

    var nameOfFinalResult = bulletChartJson.kpiName + ".geojson";;
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    var urlDestination = folderDestination + nameOfFinalResult;
    var kpiJson = fs.readFileSync(urlDestination);
    kpiJson = (JSON.parse(kpiJson));
    if (bulletChartJson.andTableIndex != -2) { //modifying andtable in the kpijson
        kpiJson.andTable[bulletChartJson.andTableIndex].targetKPI = bulletChartJson.targetKpi;
    } else {
        kpiJson.targetKPI = bulletChartJson.targetKpi;
    }

    fs.writeFile(urlDestination, JSON.stringify(kpiJson), function(err) {
        if (err) {
            res.send('write targetKPI error: ' + err);
            // return console.log(err);
        } else {
            res.send('write targetKPI successful');
        }
    });

});

app.get('/getCurrentKPI/:kpiName', function(req, res) {
    var nameOfFinalResult = req.params.kpiName + ".geojson";
    var folderDestination = globalurl + "/FinalResult/";
    folderDestination = folderDestination.replace('\\', '/');
    var urlDestination = folderDestination + nameOfFinalResult;
    var kpiJson = fs.readFileSync(urlDestination);
    kpiJson = JSON.parse(kpiJson);
    res.send(kpiJson);
})

app.post('/addFeatureAndUpdateKPI', function(req, res) {
    var markerDetails = req.body;
    var layerName = markerDetails.layer;
    var facility = markerDetails.marker;
    var layerURL = globalurl + "/geojson/" + layerName + ".geojson";
    var layerFile = JSON.parse(fs.readFileSync(layerURL));
    layerFile.features.push(facility);
    fs.writeFile(layerURL, JSON.stringify(layerFile), function(err) {
        if (err) {
            return console.log(err);
        }
    });
    res.send("success")

})
app.get('/updateKPI', function(req, res) {
    updateKPI();
    res.send("success")
})

function updateKPI() {
    var ORurlDir = globalurl + "/ORResults/";
    var url = globalurl + "/HDB/HDB.json";
    var HDB = JSON.parse(fs.readFileSync(url, "utf8"));
    var ORfiles = fs.readdirSync(ORurlDir);
    for (var m in ORfiles) {
        var aORfile = ORfiles[m];
        console.log(aORfile);
        var ORfilePath = ORurlDir + aORfile;
        var ORcontent = fs.readFileSync(ORfilePath);
        JSONreturn = JSON.parse(ORcontent);
        // console.log(JSON.stringify(aORfile));
        var ORdescriptionArray = JSONreturn[0].ORREquirement;
        var ORdescriptionArraySend = [];
        for (var n in ORdescriptionArray) {
            var requirementments = ORdescriptionArray[n].requirement_description;
            ORdescriptionArraySend.push(requirementments);
        }
        CalculateFacilities(HDB, ORdescriptionArraySend, aORfile);
    }

}

app.get('/allFinalResult', function(req, res) {
    var folderDestination = globalurl + "/FinalResult/";
    var existingFiles = fs.readdirSync(folderDestination);
    var KPIArray = [];
    for (var m in existingFiles) {
        var objectReturn = {};
        var bigORsArray = [];

        var aFinalKPIName = existingFiles[m];
        var KPIPath = folderDestination + aFinalKPIName;
        var KPIContent = JSON.parse(fs.readFileSync(KPIPath, { encoding: "utf8" }));
        var andTable = KPIContent.andTable;


        for (var n in andTable) {
            var bigORs = {};
            var ORname = andTable[n].directory;

            bigORs["directory"] = ORname;
            var HDBreturn = JSON.parse(fs.readFileSync(ORname));
            bigORs["bigORs"] = HDBreturn;
            bigORsArray.push(bigORs);
        }
        objectReturn["KPIContent"] = KPIContent;
        objectReturn["bigORsArray"] = bigORsArray;
        KPIArray.push(objectReturn);
    }
    res.send(KPIArray);
})
app.get('/getANDResults', function(req, res) {
    var AndTableCombineURL = globalurl + "/ANDResult/ANDResult.json";
    fs.readFile(AndTableCombineURL, "utf8", function(err, data) {
        data = JSON.parse(data);
        res.send(data);
        if (err) {
            return console.error(err);
        }
        // console.log(data);
    });
})

app.get('/watchHDBFile', function(req, res) {

    var url = globalurl + "/HDB/HDB.json";
    fs.watchFile(url, function(curr, prev) {
        console.log("current mtime: " + curr.mtime);
        console.log("previous mtime: " + prev.mtime);
        if (curr.mtime - prev.mtime) {
            res.send("filechange")
        }
    });
})
app.listen(3000);
console.log("Running at Port 3000");
