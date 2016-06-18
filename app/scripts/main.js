$('#modal-switch').click(function() {
    $('#modal-updateAndTable').show();
})
watchHDBchange();
L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';

$body = $("body");
$(document).on({
    ajaxStart: function() { $body.addClass("loading"); },
    ajaxStop: function() { $body.removeClass("loading"); }
});

// proj4.defs("EPSG:3414","+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs");
$("[name='my-checkbox']").bootstrapSwitch();
// $('.PostalCodeCheck').on('switchChange.bootstrapSwitch', function(event, state) {
//   console.log(this); // DOM element
//   console.log(event); // jQuery event
//   console.log(state); // true | false
// });
var postcodeContain;
$('.postalCodeCheck').on('switchChange.bootstrapSwitch', function(event, state) {
    postcodeContain = state;
    console.log(postcodeContain);
});
// var postcodeContain;
// var postcodeContain = $("#polygonCheck").is(":checked") ? $("#polygonCheck").val() : null;
// $("#polygonCheck").change(function(){
//     console.log(postcodeContain);
// })
// console.log(postcodeContain);

$('#convert').submit(function(e) {
    // postcodeContain = $("[name='my-checkbox']").val();
    var postcodeContain = $('.postalCodeCheck').is(":checked");
    // console.log(postcodeContain);
    // var postcodeContain = true;
    // if(postcodeContain === "on"){
    // var postcodeContain = true;

    // }
    var file = $("#upload")[0].files[0];

    var layerName = file.name;

    e.preventDefault();

    $(this).ajaxSubmit({
        // console.log("submit");
        success: function(data, textStatus, jqXHR) {
            if (postcodeContain === true) {
                var arrayofPoints = data.features;

                for (index in arrayofPoints) {

                    aPoint = arrayofPoints[index];
                    var postcode = aPoint.properties.POSTALCODE;
                    if (typeof postcode === "undefined") {
                        $('#modal-NoContainPostalcode').modal('show');
                    } else {
                        if (postcode.length < 6) {
                            postcode = "0" + postcode;
                        }
                        var breakPoint = arrayofPoints.length;
                        getPostalCodeGeo(layerName, aPoint, postcode, breakPoint, aPoint)

                    }

                    // data.features[index].geometry = [1,1];
                }

            } else {
                var layer = {
                        "name": layerName,
                        "datamain": data
                    }
                    // layer.data = data
                var dataSend = JSON.stringify(layer);
                // console.log(dataSend);
                $.ajax({
                    url: '/upload',
                    type: 'POST',
                    data: dataSend,
                    contentType: 'application/json',

                    success: function(data) {
                        console.log('success');
                        location.reload();
                    }
                });

            }

        }

    })

});
var HDBdataSend = null;

function getPostalCodeGeo(layerName, aPoint, postcode, breakPoint, aPoint) {
    breakPoint = parseInt(breakPoint);
    url = "/getPostalCode/" + postcode;
    InvalidPostalCode = []
    coordinateArray = [];


    $.getJSON(url, function(objectReturn) {
        // var breakPoint = parseInt(index) + 1;
        var objectLocation = { "type": "Point", "coordinates": objectReturn }
        if (!objectReturn.hasOwnProperty("postalcode")) {
            aPoint.geometry = objectLocation;
            // console.log(JSON.stringify(aPoint));
            coordinateArray.push(aPoint);
            // console.log(coordinateArray.length);

        } else {
            // console.log(aPoint);
            InvalidPostalCode.push(aPoint);
            console.log(objectReturn);
        }
        var loopendPoint = coordinateArray.length + InvalidPostalCode.length;
        // console.log(loopendPoint);
        if (loopendPoint === breakPoint) {
            // console.log("dataSend");
            var dataReturn = {
                    "type": "FeatureCollection",
                    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::3414" } },
                    "features": []
                }
                // console.log(InvalidPostalCode);
            dataReturn.features = coordinateArray;
            var layer = {
                    "name": layerName,
                    "datamain": dataReturn
                }
                // layer.data = data
            var dataSend = JSON.stringify(layer);
            HDBdataSend = dataSend;
            var printout = "<b>The Below Postal Code is(are) Invalid:</b></br>";
            if (InvalidPostalCode.length > 0) {

                for (var m = 0; m < InvalidPostalCode.length; m++) {
                    var outError = "<p>" + (m + 1) + ") ";
                    var JsonObj = InvalidPostalCode[m].properties;
                    for (var key in JsonObj) {
                        outError += key + ": " + JsonObj[key] + "</p>";
                        // console.log(key + JsonObj[key]);

                    }
                    printout += outError + "</br>";
                }
                $('#PostlError').append(printout);
                $('#modal-login').modal('show');
                // $('#modal-join').modal('show');
            } else {
                writeHDB(HDBdataSend);
                // $('#modal-hdbsuccessful').modal('show');
            }

        }


    })

}

function writeHDB(dataSend) {
    $.ajax({
        url: '/uploadlayer',
        type: 'POST',
        data: dataSend,
        contentType: 'application/json',

        success: function() {
            alert('success');
        }
    });
    if ($('#modal-login').is(':visible')) {
        $('#modal-login').modal('hide');

    }
    $('#modal-hdbsuccessful').modal('show');


}
var HDBupload = null;
$("#proceeedPostcode").click(function() {
    // console.log(HDBdataSend);
    writeHDB(HDBdataSend);
})
$("#proceeedHDB").click(function() {
    // console.log(HDBdataSend);
    uploadHDBtoFile(HDBupload);

})
$("#OK").click(function() {
    // console.log(HDBdataSend);
    location.reload();

})
$("#HDBOK").click(function() {
    // console.log(HDBdataSend);
    location.reload();

})

function uploadHDBtoFile(dataSend) {
    $.ajax({
        url: '/writeHDBs',
        type: 'POST',
        data: JSON.stringify(dataSend),
        contentType: 'application/json',

        success: function() {
            alert('success');
        }
    });
    $('#HDBUploadSuccessful').append(dataSend.length + " HDBs succcessful Uploaded");
    if ($('#modal-HDBFail').is(':visible')) {
        $('#modal-HDBFail').modal('hide');

    }
    $('#modal-HDBsuccessful').modal('show');
}
$(document).ready(function() {
    function onEachFeature(feature, layer) {
        // does this feature have a property named popupContent?
        if (feature.properties) {
            var popupContent = "";
            for (var propertyname in feature.properties) {
                // console.log(feature.properties[propertyname]);
                popupContent += "<b>" + propertyname + "</b>" + ": " + feature.properties[propertyname].toString() + "</br>";
            }
            layer.bindPopup(popupContent);
        }
    }
    var layerFiles = [];
    $('#files').change(function(evt) {
        var findpolygon = false;
        var HDBsent = [];
        var files = evt.target.files;
        for (var i = 0; i < files.length; i++) {
            file = files.item(i);
            fileExtension = file["name"].substr(file["name"].lastIndexOf('.') + 1);
            if (fileExtension === "csv") {
                Papa.parse(file, {
                    download: true,
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        HDBupload = results;
                        var leafletFeatures = []; //array of leaflet feature objects
                        fields = results["data"];
                        HDBupload = results["data"]
                        var objectsSend = [];
                        var lengthofHDBRequest = fields.length;
                        for (var i = 0; i < fields.length; i++) {
                            field = fields[i];
                            var leafletFeature = new Object(); //single leaflet object
                            leafletFeature["type"] = "Feature";
                            leafletFeature["properties"] = field;
                            // console.log(field);
                            // console.log(leafletFeature);
                            var postcode = field["POSTCODE"].toString();
                            if (postcode.length < 6) {
                                postcode = "0" + postcode;
                            }
                            field["length"] = lengthofHDBRequest;
                            objectsSend.push(field);


                        };
                        if (findpolygon) {

                            $.ajax({
                                url: '/findHDBPolygon',
                                type: 'POST',
                                data: JSON.stringify(objectsSend),
                                contentType: 'application/json',
                                success: function(data) {
                                    // console.log(data);
                                    location.reload();
                                }
                            });
                        } else {
                            var test = false;

                            if (test) {
                                var minrequest = 1000;
                                var loopNumber = parseInt(objectsSend.length / minrequest);

                                for (var m = 0; m < loopNumber; m++) {
                                    var objectArrayPartition = [];
                                    for (var n = 0; n < minrequest; n++) {
                                        var index = m * minrequest + n;
                                        var value = objectsSend[index];
                                        objectArrayPartition.push(value);
                                    }
                                    $.ajax({
                                        url: '/findPostalCode',
                                        type: 'POST',
                                        data: JSON.stringify(objectArrayPartition),
                                        contentType: 'application/json',
                                        success: function(data) {
                                            $body.removeClass("loading");
                                            console.log(data)
                                        }
                                    })
                                }

                            }else{
                                $.ajax({
                                        url: '/findPostalCode',
                                        type: 'POST',
                                        data: JSON.stringify(objectsSend),
                                        contentType: 'application/json',
                                        success: function(data) {

                                            $body.removeClass("loading");
                                            location.reload();
                                        }
                                    }) 
                            }



                            // var InvalidPostalCode = data.InvalidHDBsArray;
                            // var HDBs = data.HDB;
                            // var lengthofHDBRequest = HDBs.length;
                            // HDBupload = HDBs;
                            // var printout = "<b>The Below HDB PostalCode is(are) Invalid:</b></br>";
                            // if (InvalidPostalCode.length > 0) {
                            //     lengthofHDBRequest = lengthofHDBRequest - InvalidPostalCode.length;
                            //     for (var m = 0; m < InvalidPostalCode.length; m++) {
                            //         var outError = "<p>" + (m + 1) + ") ";
                            //         var JsonObj = InvalidPostalCode[m];
                            //         for (var key in JsonObj) {
                            //             if(key!= "length"){
                            //                 outError += key + ": " + JsonObj[key] + "</p>";
                            //             }
                            //         }
                            //         printout += outError + "</br>";
                            //     }
                            //     $body.removeClass("loading"); 
                            //     $('#HDBUpload').append(printout);
                            //     $('#modal-HDBFail').modal('show');
                            // }else{
                            //     // HDBs["lengthofHDBRequest"] = lengthofHDBRequest;
                            //     console.log("start upload");
                            //     uploadHDBtoFile(HDBs);
                            //     // $('#HDBUploadSuccessful').append(objectsSend.length + " HDBs succcessful Uploaded");
                            //     $body.removeClass("loading"); 
                            //     $('#modal-HDBsuccessful').modal('show');
                            // }



                            // }
                            // });
                        }
                    }
                });
            }
        }
    });
})
// console.log(HDBdataSend);
function watchHDBchange(){
    $.get("/watchHDBFile", function(data){
       
        $('#HDBUploadSuccessful').append(HDBupload.length + " HDBs succcessful Uploaded");
        
    })
}
