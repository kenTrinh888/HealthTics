L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
$body = $("body");
$(document).on({
    ajaxStart: function() { $body.addClass("loading"); },
    ajaxStop: function() { $body.removeClass("loading"); }
});

var HDBoption;
var HDBInsideHexbin;
$('#displayHDBs').change(function() {
        HDBoption = $(this).val();

    })
    // $('#map').attr('name');

var colors = ["OrRd", "PuBu", "BuPu", "Oranges",
    "BuGn", "YlOrBr", "YlGn", "Reds",
    "RdPu", "Greens", "YlGnBu", "Purples",
    "GnBu", "Greys", "YlOrRd", "PuRd", "Blues",
    "PuBuGn", "Spectral", "RdYlGn", "RdBu",
    "PiYG", "PRGn", "RdYlBu", "BrBG",
    "RdGy", "PuOr", "Set2", "Accent",
    "Set1", "Set3", "Dark2", "Paired",
    "Pastel2", "Pastel1"
];
var method = ['equal_interval', 'jenks', 'quantile']
var methodOption = '';
var option = '';
for (var i = 0; i < colors.length; i++) {
    option += '<option value="' + colors[i] + '">' + colors[i] + '</option>';
}
$('#items').append(option);
for (var i = 0; i < method.length; i++) {
    var methodValue = "";
    if (i == 0) {
        methodValue = "Equal Interval";
    } else if (i == 1) {
        methodValue = "Jenks";
    } else {
        methodValue = "Quantile";
    }
    methodOption += '<option value="' + method[i] + '">' + methodValue + '</option>';
}
$('#methods').append(methodOption);

// ButtonLgendHideShow

$('#items').prop("disabled", true);
$('#methods').prop("disabled", true);
$('#hexbinWidth').prop("disabled", true);
$('#displayHDBs').prop("disabled", true);
$("[name='maplegend']").bootstrapSwitch("disabled", true);

/* create leaflet map */
var OpenStreetMap_Mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var Hydda_Full = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var Stamen_Toner = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});
var CartoDB_DarkMatter = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 11,
    layers: [Stamen_Toner, OpenStreetMap_BlackAndWhite, OpenStreetMap_Mapnik, CartoDB_DarkMatter, Hydda_Full],
    // zoomControl: false
});
// Disable drag and zoom handlers.
map.dragging.disable();
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
map.keyboard.disable();

var baseMaps = {
    "OpenStreetMap_Mapnik": OpenStreetMap_Mapnik,
    "Stamen_Toner": Stamen_Toner,
    "OpenStreetMap_BlackAndWhite": OpenStreetMap_BlackAndWhite,
    "CartoDB_DarkMatter": CartoDB_DarkMatter,
    "Hydda_Full": Hydda_Full
};
var layerGroup = L.layerGroup().addTo(map);
var layerGroup = false;
var hexbinGroupLayer = false;
var sucessfulHDBGroupLayer = false;
L.control.layers(baseMaps).addTo(map);
var legend = L.control({ position: 'bottomright' });
var hasLegend = false;
var count = 0;

function GetHexbinVisualisation(KPIJson, colors, method) {
    // console.log(KPIJson);
    if (layerGroup != false) {
        layerGroup.clearLayers();
        layerGroup = false;
    }
    if (hasLegend === true) {
        legend.removeFrom(map);
    }
    if (colors === null) {
        colors = "OrRd";
    }
    if (method === null) {
        method = "equal_interval";
    }
    var data = getHexbinDataSync(KPIJson);
    console.log(data);
    var grid = data.counted;
    var values = [];
    var brew = new classyBrew();
    // console.log(data);
    grid.features.forEach(function(cell) {
        cell.kpiName = KPIJson.kpiName
        var pt_count = cell.properties.pt_count;
        if (method === "quantile") {
            if (pt_count != 0) {

                values.push(pt_count);
            }
        } else {
            values.push(pt_count);
        }
    });
    brew.setSeries(values);
    brew.setNumClasses(6);
    var breaks = brew.getBreaks();
    // console.log(breaks);
    brew.setColorCode(colors); // set color code
    // i.e. equal_interval, jenks, quantile
    brew.classify(method);
    // var colors = brew.getColors();
    grid.features.forEach(function(cell) {
         // console.log(cell);
        var pt_count = cell.properties.pt_count;
        var _withCount = cell._withCount = {};
        _withCount.fillColor = brew.getColorInRange(pt_count)
        var WO = assignWeightandOpacity(pt_count, breaks);
        var weight = WO.split(",")[0];
        var fillOpacity = WO.split(",")[1];
        _withCount.fillOpacity = fillOpacity;
        _withCount.weight = weight;
    });

    layerdata = L.Proj.geoJson(grid, {
            onEachFeature: onEachFeature,
            style: style
        })
        // L.layerGroup()
        //     .addLayer(layerdata)
        //     .addTo(map);
    if (layerGroup === false) {
        layerGroup = L.layerGroup()
            .addLayer(layerdata)
            .addTo(map);
    }
    //         count+=1;
    // layerControl.addOverlay(layerdata, "NewClass" );

    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
            percents = brew.getBreaks(),
            labels = [],
            from, to;
        for (var i = 0; i < percents.length; i++) {
            from = percents[i];
            to = percents[i + 1];
            // console.log(from);
            // var color = brew.getColorInRange(12);
            // console.log(color);
            if (to) {
                labels.push(
                    '<i style="background:' + brew.getColorInRange(from) + '"></i> ' +
                    from.toFixed(0) + '&ndash; ' + to.toFixed(0));
            }
        }
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);
    hasLegend = true;
}

function getHexbinDataSync(KPIJson) {
    // console.log(KPIJson);
    getDataHexbin = "getHexbinVisualGeojson/";
    var data = {};
    // console.log(KPIJson);
    $.ajax({
        type: "POST",
        contentType: "application/JSON",
        data: JSON.stringify(KPIJson),
        url: getDataHexbin,
        success: function(req) {
            data = req;
        },
        async: false
    });
    // $.ajaxSetup({ async: false });
    // var data = $.get(getDataHexbin).responseText;
    // $.ajaxSetup({ async: true });
    // console.log(data);
    return data;
}

function assignWeightandOpacity(pointcount, breaks) {
    var weight = 0;
    var fillOpacity = 0;
    for (var m = 0; m < breaks.length; m++) {
        var aBreak = breaks[m];
        var newWeight = m + 1;
        var newOpacity = m / 10;
        if (pointcount > 0) {

            weight = 1;
            fillOpacity = newOpacity
        }
    }
    return weight + "," + fillOpacity;
}

function style(feature) {
    return feature._withCount
}

function onEachFeature(feature, layer) {
    // console.log(feature);
    layer.on({
        // mouseover: highlightFeature,
        // mouseout: resetHighlight,
        click: zoomToFeature
    });
}
var info = L.control();
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
};
info.update = function(feature) {
    // console.log(feature);
    if (feature != null) {
        // console.log(feature);
        var count = feature.pt_count;
        this._div.innerHTML = (count ? count + ' HDB(s)' : 'Click the grid');
    } else {
        // console.log(feature);
        this._div.innerHTML = ('Click the grid');
    }
};
info.addTo(map);


function resetHighlight(e) {
    layerdata.resetStyle(e.target);
    info.update(e.target.feature);
}

var LayerClick = [];

function zoomToFeature(e) {
    // console.log(e);
    if (LayerClick.length === 0) {
        LayerClick.push(e);
        highlightFeature(e);
        var hexbinSend = e.target.feature;
        // console.log(hexbinSend);
        FocusHexbin(hexbinSend);

    } else {
        // console.log(LayerClick);
        LayerClick.push(e);
        var previouslayer = LayerClick[LayerClick.length - 2];
        resetHighlight(previouslayer);
        highlightFeature(e);
        var hexbinSend = e.target.feature;
        // console.log(hexbinSend);
        FocusHexbin(hexbinSend);
    }

}

function highlightFeature(e) {
    var layer = e.target;
    var color = layer.feature._withCount.fillColor;
    layer.setStyle({
        weight: 10,
        color: color,
        dashArray: '',
        stroke: "red",
        fillOpacity: 2
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
    info.update(layer.feature.properties);
}
// =======================================================Second Map========================================
var OpenStreetMap_MapnikZoomin = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var OpenStreetMap_BlackAndWhiteZoomin = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var Hydda_FullZoomin = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
    attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
var Stamen_TonerZoomin = L.tileLayer('http://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 20,
    ext: 'png'
});
var CartoDB_DarkMatterZoomin = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
});
var baseMapsZoomin = {
    "OpenStreetMap_Mapnik": OpenStreetMap_MapnikZoomin,
    "OpenStreetMap_BlackAndWhite": OpenStreetMap_BlackAndWhiteZoomin,
    "Hydda_Full": Hydda_FullZoomin
};
var zone, ZoominMap = L.map('ZoominMap', {
    center: [1.35, 103.8],
    zoom: 11,
    layers: [OpenStreetMap_BlackAndWhiteZoomin, OpenStreetMap_MapnikZoomin, Hydda_FullZoomin]
});
L.control.layers(baseMapsZoomin).addTo(ZoominMap);
// ZoominMap.dragging.disable();
// ZoominMap.touchZoom.disable();
// ZoominMap.doubleClickZoom.disable();
// ZoominMap.scrollWheelZoom.disable();
// ZoominMap.keyboard.disable();
// if (ZoominMap.tap) ZoominMap.tap.disable();

function FocusHexbin(hexbinSend) {
    if (hexbinGroupLayer != false) {
        hexbinGroupLayer.clearLayers();
        hexbinGroupLayer = false;
    }
    hexbinSend.HDBoption = HDBoption;

    // console.log(hexbinSend);
    var dataSend = JSON.stringify(hexbinSend);
    // console.log(dataSend);
    var data = $.ajax({
        url: '/getHexbinContainHDBs',
        type: 'POST',
        data: dataSend,
        contentType: 'application/json',
        async: false
    });
    dataJSON = data.responseJSON;
    // console.log(data);

    var HDBPoints = dataJSON.HDBPoints;
    HDBInsideHexbin = HDBPoints;
    // console.log(HDBPoints);
    var hexbinPoint = dataJSON.hexbin;
    var Hexbinstyle = {
        weight: 2,
        color: '#000000',
        fillOpacity: 0
    }

    var hexbinMap = L.Proj.geoJson(hexbinPoint, {
        style: Hexbinstyle
    })
    if (hexbinGroupLayer === false) {
        hexbinGroupLayer = L.layerGroup()
            .addLayer(hexbinMap)
            .addTo(ZoominMap);
    }
    // console.log(HDBPoints);
    displayHDBPropotion(HDBPoints);
    ZoominMap.fitBounds(hexbinMap.getBounds());

}

function styleZoomin(feature) {
    return {
        // fillColor: "blue",
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function changeHexBinAlgo(KPIJson) {
    // console.log(KPIJson);
    $('.hexbin').change(function() {
        var colors = $('#items').val();
        var methods = $('#methods').val();
        var KPIname = $('#map').attr('name');
        // console.log(colors + " " + methods);
        GetHexbinVisualisation(KPIJson, colors, methods);
    })
}

// =======================================================End Second Map========================================

function displayHDBPropotion(dataLayer) {
    createPropSymbols(dataLayer);
}

function createPropSymbols(dataLayer) {
    if (sucessfulHDBGroupLayer != false) {
        sucessfulHDBGroupLayer.clearLayers();
        sucessfulHDBGroupLayer = false;
    }
    zone = L.Proj.geoJson(dataLayer, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                fillColor: "#708598",
                color: '#537898',
                weight: 1,
                fillOpacity: 0.6

            });
        }
    });

    updatePropSymbols();
    if (sucessfulHDBGroupLayer === false) {
        sucessfulHDBGroupLayer = L.layerGroup()
            .addLayer(zone)
            .addTo(ZoominMap);
    }

} // end createPropSymbols()
function updatePropSymbols() {

    zone.eachLayer(function(layer) {
        // console.log(layer); // Display layer is match with the zoomin map
        var analysisDisplay = "<b>Recommendation: </b></br>";
        var analysis = layer.feature.properties.analysis;
        for (var m in analysis){
            var analysisComment = analysis[m] + "</br>" ;
            analysisDisplay += analysisComment;
        }
        var props = layer.feature.properties,
            radius = calcPropRadius(props.pt_count),
            analysis =
            popupContent = "<b>POSTAL CODE: </b>" + props.POSTCODE + "</br>"+ "<b>ZONE: </b>" + props.POSTCODE + "</br>"+analysisDisplay+"<b>Accessible Facilities: </b>" + String(props.pt_count) + "<br>";
        // console.log(radius)
        layer.setRadius(radius);

        // console.log(layer.feature.properties);


        // layer.on('click', function(e) {
        //     alert(e.latlng); // e is an event object (MouseEvent in this case)
        // });
        // layer.bindPopup(popupContent).openPopup();
        layer.bindPopup(popupContent, {
            // offset: new L.Point(0, -radius)
            // autoPan:true
            keepInView: true
        });
        layer.on({
            mouseover: function(e) {
                this.openPopup();
                this.setStyle({
                    color: 'yellow'
                });
            },
            mouseout: function(e) {
                this.closePopup();
                this.setStyle({
                    color: '#537898'
                });

            }
        });

    });
} // end updatePropSymbols
function calcPropRadius(attributeValue) {
    // console.log(attributeValue);
    var scaleFactor = 30; // value dependent upon particular data set
    if (attributeValue < 1) {
        area = 20;
    } else {
        area = attributeValue * scaleFactor;
    }

    return Math.sqrt(area / Math.PI) * 2;

} // end calcPropRadius

// /-------End Display Propotional Map------------/

//LEGEND HANDLING
$('.LegendShowHide').on('switchChange.bootstrapSwitch', function(event, state) {
    // postcodeContain = state;
    // console.log(state);
    if (state === true) {
        if (hasLegend === false) {
            legend.addTo(map);
        }

    } else {
        legend.removeFrom(map);
        hasLegend = false;
    }
});

// DISPLAY PLANNING zone
function changeHexbinWidth(KPIJson) {
    $('#hexbinWidth').change(function() {
        var hexbinWidth = $(this).val();
        KPIJson['hexbinWidth'] = hexbinWidth;
    })
}

// DISPLAY PLANNING zone
var successful = true;

function changeHDBDisplay(KPIJson) {
    $('#displayHDBs').change(function() {
        successful = !successful
        var HDBchoice = $(this).val();
        KPIJson['HDBchoice'] = HDBchoice;
    })
}


//=============== Map Planning Section
// attaching function on map click
ZoominMap.on('click', onMapClick);

// Script for adding marker on map click

function onMapClick(e) {
    // $.each(ZoominMap._layers, function(ml) {
    //     //console.log(map._layers)
    //     if (ZoominMap._layers[ml].feature) {
    //         var name = this.feature.properties.title;
    //         if (name === "ResourceTempAllocation") {
    //             ZoominMap.removeLayer(this);
    //         }
    //     }
    // })

    // var deleteButton = "<input type='button' value='Delete This Marker' class='marker-delete-button'/>";
    var addToLayerButton = "<input type='button' value='Add a Facility' class='marker-add-button'/>"

    var geojsonFeature = {
        "type": "Feature",
        "properties": { "title": "ResourceTempAllocation" },
        "geometry": {
            "type": "Point",
            "coordinates": [e.latlng.lat, e.latlng.lng]
        }
    }



    var marker;
    L.geoJson(geojsonFeature, {

        pointToLayer: function(feature, latlng) {

            marker = L.marker(e.latlng, {

                title: "Resource Location",
                alt: "Resource Location",
                riseOnHover: true,
                draggable: true,

            }).bindPopup(addToLayerButton);

            marker.on("popupopen", onPopupOpen);

            return marker;
        }
    }).addTo(ZoominMap);

}

// Function to handle delete as well as other events on marker popup open

function onPopupOpen() {



    //var tempMarkerGeoJSON = this.toGeoJSON();

    //var lID = tempMarker._leaflet_id; // Getting Leaflet ID of this marker

    // To remove marker on click of delete
    // $(".marker-delete-button:visible").click(function() {
    //     ZoominMap.removeLayer(tempMarker);
    // });
    $(".marker-add-button").click(function() {
        var url = "getAllLayerColumnName";
        var layerNameArray = getLayerComponent(url);
        CreateDropdown(layerNameArray);
        $('#modal-AddMarker').modal('show');
    });
}

function getLayerComponent(url) {
    var layerNameArray = $.ajax({
        type: "GET",
        url: url,
        async: false
    }).responseJSON;
    return layerNameArray;
}

// Populate DropdownList base on layer uploaded
function CreateDropdown(ObjectArray) {
    $("#AddMarker").empty();
    for (var i in ObjectArray) {
        var tempname = ObjectArray[i].name;
        var name = hideExtentions(tempname)
        var dropdownList = "<li><a href='#'  data-value='" + name + "'>" + name + "</a></li>"
        $("#AddMarker").append(dropdownList);
    }

}

function hideExtentions(nameOfLayer) {
    var name = nameOfLayer.split(".")[0];
    return name;
}

var dropdownvalueChosen = "";
$("#AddMarker").on("click", "li", "a", function() {
    var value = $(this).text();
    dropdownvalueChosen = value;
    // console.log(value);
    $(this).parents(".dropdown").find('.btn').html($(this).text() + ' <span class="caret"></span>');
    $(this).parents(".dropdown").find('.btn').val($(this).data('value'));
    var url = "getAllLayerColumnName";
    MarkerFormCreation(url, value);
});

// Populate Form based on Layer Chosen
function MarkerFormCreation(url, value) {
    var attachRow = "";
    $('#markerForm').empty();
    var ObjectArray = getLayerComponent(url);
    for (var i in ObjectArray) {
        var tempname = ObjectArray[i].name;
        var name = hideExtentions(tempname)
        if (value === name) {
            var columns = ObjectArray[i].columns;
            for (var m in columns) {
                var columnName = columns[m];
                var id = columnName;
                attachRow = '<div class="form-group row"><label class="col-sm-2 form-control-label">' + columnName + '</label><div class="col-sm-10"><input type="text" class="form-control" name= \"' + id + '\" id=' + '\"' + id + '\"' + '></div></div>';
                $('#markerForm').append(attachRow);

            }
        }
    }
}

$('#AddMarkerConfirm').click(function() {
    var object = {};
    var prop = {};
    var dataString = $('#markerForm').serialize()
    var stringSplit = dataString.split("&");
    for (var i in stringSplit) {
        var stringGet = stringSplit[i].split("=");
        var name = stringGet[0];
        var properties = stringGet[1];
        prop[name] = properties;
    }
    // var value = $('#AddMarker li a').text();
    object['layer'] = dropdownvalueChosen;
    $.each(ZoominMap._layers, function(ml) {
        if (ZoominMap._layers[ml].feature) {
            var name = this.feature.properties.title;
            if (name === "ResourceTempAllocation") {
                this.feature.properties = prop;
                var tempCoordinates = this.feature.geometry.coordinates;
                var tempChange = tempCoordinates[0];
                this.feature.geometry.coordinates[0] = tempCoordinates[1];
                this.feature.geometry.coordinates[1] = tempChange;
                object['marker'] = this.feature;

            }
        }
    })
    $.ajax({
        type: "POST",
        contentType: "application/JSON",
        data: JSON.stringify(object),
        url: "/addFeatureAndUpdateKPI",
        success: function(req) {
            console.log("sucess");
            $('#modal-AddMarker').modal('hide');
            updateKPI();

        }
    });
})

function updateKPI() {
    $.get("/updateKPI", function(data) {
        if (data == "success") {
            setAndTable();
            loadAndTableData();
            UpdateloadResultTableDataWithIndexes();

        }
    })

}
