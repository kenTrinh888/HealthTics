var express = require("express");
var http = require("http");
var app = express();
var request = require('request');
var mapshaper = require('mapshaper');
var fs = require("fs");
//upload libs
var bodyParser = require('body-parser');
var multer = require('multer');
var busboy = require('connect-busboy');
var globalurl = __dirname + '/app';
// var path = express.static(__dirname + '/app');
// console.log(path);
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

// app.post('/fileupload', upload.single('file'),function(req, res) {
//     var fstream;
//     req.pipe(req.busboy);
//     req.busboy.on('file', function (fieldname, file, filename) {
//         console.log("Uploading: " + filename); 
//         fstream = fs.createWriteStream(__dirname + '/files/' + filename);
//         file.pipe(fstream);
//         fstream.on('close', function () {
//             res.redirect('back');
//         });
//     });
// });
// for upload files 

// get the name for file
function getSecondPart(str) {
    return str.split('.')[0];
}

app.post('/upload', upload.array('avatar'), function(req, res) {
    // var newPath = __dirname + "/uploads/uploadedFileName";
    var name = req.files[0].originalname;
    var nameString = getSecondPart(name);
    var file = __dirname + "/" + name;
    var filePath = req.files[0].path;
    // console.log(req.files[0].path);
    convert(filePath,nameString);
    res.redirect("back");
    // fs.readFile(req.files[0].path, function(err, data) {
        // console.log(data);
        // covert()
        // fs.writeFile(file, data, 'utf8', function(err) {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         response = {
        //             message: 'File uploaded successfully',
        //             filename: name,

        //         };
        //         res.redirect("back");
        //     }
        //     console.log(response);
        //     // res.end( JSON.stringify( response ) );


        // });
    // });

});



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
    var urlString = "http://www.onemap.sg/API/services.svc/basicSearch?token=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr&searchVal=" + postcode + "&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1";
    request(urlString, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body) // Show the HTML for the Google homepage.
            res.send(body);
        }
    });
})

// convert shapefile to geojson
var ogr2ogr = require('ogr2ogr')
// function convert(file){
// var ogr = ogr2ogr(file);

// ogr.exec(function (er, data) {
//   if (er) console.error(er)
//   console.log(data)
// })

// }
 

// var ogr2 = ogr2ogr(globalurl + '/geojson/buildings.geojson')
// ogr2.stream().pipe()
function convert(file, name){
  var shapefile = ogr2ogr(file)
          .format('GeoJSON')
          .skipfailures()
          // .project("EPSG:3414")
          .stream()
shapefile.pipe(fs.createWriteStream(globalurl + '/geojson/' + name+'.json'))

}


// convert Shapfile to geojson
// var requestSuper = require("superagent")
// var urlShapeFile = globalurl + "/uploads"
// function covertToGeo (file) {
//   requestSuper
//   .post('http://ogre.adc4gis.com/convert')
//   // .field('sourceSrs', 'EPSG:4326')
//   // .field('targetSrs', 'EPSG:900913')
//   .attach('upload', file)
//   .end(function (er, res) {
//     if (er) return console.error(er)
//     console.log(res.body)
//   })

// };
var turf = require('turf');

// var healthierDining = require("./app/geojson/HEALTHIERDINING.json");
// var playSG = JSON.parse(fs.readFileSync('./app/geojson/playSG.geojson', 'utf8'));
// // console.log(json);



// var unit = 'meters';
// var transferJSON = playSG.features
// // console.log(transferJSON);

// var buffered = turf.buffer(playSG, 500, unit);
// var result = turf.featurecollection([buffered, playSG]);
// fs.writeFileSync('./app/geojson/result.json',JSON.stringify(result));
// console.log(result);
var pt = {
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Point",
    "coordinates": [-90.548630, 14.616599]
  }
};
var unit = 'miles';

var buffered = turf.buffer(pt, 500, unit);
var result = turf.featurecollection([buffered, pt]);
fs.writeFileSync('./app/geojson/result.json',JSON.stringify(result));

// var building = require("./app/geojson/shapefile.json");


// var centroids = turf.featurecollection([]);
// for(var i = 0; i < healthierDining.features.length; i++) {
//   centroids.features.push(turf.centroid(healthierDining.features[i]));
// }

// var centroidPt = turf.centroid(building);

// var result = {
//   "type": "FeatureCollection",
//   "features": [building, centroidPt]
// };
// console.log(JSON.stringify(result.features));
// fs.writeFileSync('./app/geojson/result.json', JSON.stringify(result.features[0]));



// -i provinces.shp -simplify dp 20% -o format=geojson out.json
app.listen(3000);
console.log("Running at Port 3000");
