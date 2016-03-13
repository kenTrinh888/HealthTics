L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
$body = $("body");

$(document).on({
    ajaxStart: function() { $body.addClass("loading"); },
    ajaxStop: function() { $body.removeClass("loading"); }
});

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
    methodOption += '<option value="' + method[i] + '">' + method[i] + '</option>';
}
$('#methods').append(methodOption);

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
    layers: [Stamen_Toner, OpenStreetMap_BlackAndWhite, OpenStreetMap_Mapnik, CartoDB_DarkMatter, Hydda_Full]
});
var baseMaps = {
    "OpenStreetMap_Mapnik": OpenStreetMap_Mapnik,
    "Stamen_Toner": Stamen_Toner,
    "OpenStreetMap_BlackAndWhite": OpenStreetMap_BlackAndWhite,
    "CartoDB_DarkMatter": CartoDB_DarkMatter,
    "Hydda_Full": Hydda_Full
};
var layerGroup = L.layerGroup().addTo(map);
var layerControl = L.control.layers();
L.control.layers(baseMaps).addTo(map);
var KPIname = "NewKPI1";
// GetHexbinVisualisation(KPIname, "OrRd", "equal_interval");
var legend = L.control({ position: 'bottomright' });
function GetHexbinVisualisation(KPIname, colors, method) {
    // if(legend != "undefined"){
    //     legend.removeFrom(map);
    // }
    // layerControl._layers ='';
    // console.log(layerControl._layers.length);
    var controlOnject = layerControl._layers
    for (var key in controlOnject) {
        if (controlOnject.hasOwnProperty(key)) {
            console.log(key + " -> " + controlOnject[key]);
            delete controlOnject[key];
        }
    }
    if (colors === null) {
        colors = "OrRd";
    }

    if (method === null) {
        method = "equal_interval";
    }

    // console.log(colors+method)
    // var KPIname = KPIname
    // var legend = L.control({ position: 'bottomright' });
    // legend.removeFrom(map);
    $.getJSON("/getHexbinVisualGeojson/" + KPIname, function(data) {
        var grid = data.counted;
        var values = [];
        var brew = new classyBrew();

        grid.features.forEach(function(cell) {
            var pt_count = cell.properties.pt_count;
            if (method === "quantile"){
                if(pt_count != 0){
                    values.push(pt_count);
                }
            }else{
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
            var pt_count = cell.properties.pt_count;
            var _withCount = cell._withCount = {};
            _withCount.fillColor = brew.getColorInRange(pt_count)
            var WO = assignWeightandOpacity(pt_count, breaks);
            var weight = WO.split(",")[0];
            var fillOpacity = WO.split(",")[1];
            _withCount.fillOpacity = fillOpacity;
            _withCount.weight = weight;
            // _withCount.stroke = false;
        });

        layerdata = L.Proj.geoJson(grid, {
            onEachFeature: onEachFeature,
            style: style
        }).addTo(map);

        // if (layerControl === false) {
        //     layerControl = L.control.layers().addTo(map);
        // }

        layerControl.addOverlay(layerdata, "NewClass");
        // map.on('overlayadd', function (eventLayer) {
        //     console.log(eventLayer.name);
        // })
        // layerControl = true;

        // ==============================Creating Legend===========================
        
        legend.onAdd = function(map) {
            var div = L.DomUtil.create('div', 'info legend'),
                percents = brew.getBreaks(),
                labels = [],
                from, to;
            for (var i = 0; i < percents.length; i++) {

                from = percents[i];
                to = percents[i + 1];
                 console.log(from);
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
        // legend.removeFrom(map);

        legend.addTo(map);
        
        
        
        // var legendonChange = L.control({ position: 'bottomright' });
        // legendonChange.onAdd = function(map) {
        //     var div = L.DomUtil.create('div', 'info legend'),
        //         percents = brew.getBreaks(),
        //         labels = [],
        //         from, to;
        //     for (var i = 0; i < percents.length; i++) {
        //         from = percents[i];
        //         to = percents[i + 1];
        //         if (to) {
        //             labels.push(
        //                 '<i style="background:' + brew.getColorInRange(from) + '"></i> ' +
        //                 from.toFixed(0) + '&ndash; ' + to.toFixed(0));
        //         }
        //     }
        //     div.innerHTML = labels.join('<br>');
        //     return div;
        // };
        // legend.addTo(map);
        // map.on('overlayadd', function(eventLayer) {
        //     // Switch to the Population legend...
        //     if (eventLayer.name === 'New Class') {
        //         this.removeControl(legendonChange);
        //         legend.addTo(this);
        //     } else { // Or switch to the Population Change legend...
        //         this.removeControl(legend);
        //         legendonChange.addTo(this);
        //     }
        // });
        // ==============================Creating Legend===========================
    })


}

function assignWeightandOpacity(pointcount, breaks) {
    var weight = 0;
    var fillOpacity = 0;
    for (var m = 0; m < breaks.length; m++) {
        var aBreak = breaks[m];
        var newWeight = m + 1;
        var newOpacity = m / 10;
        if (pointcount > aBreak) {
            weight = newWeight;
            fillOpacity = newOpacity
        }
    }
    return weight + "," + fillOpacity;
}

function style(feature) {
    return feature._withCount
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
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
    if (feature != null) {
        // console.log(feature);
        var count = feature.properties.pt_count;
        this._div.innerHTML = (count ? count + ' HDB(s)' : 'Hover over a grid');
    } else {
        this._div.innerHTML = ('Hover over a grid');
    }
};
info.addTo(map);

function resetHighlight(e) {
    layerdata.resetStyle(e.target);
    info.update(e.target.feature);
}

function zoomToFeature(e) {
    var hexbinSend = e.target.feature;
    FocusHexbin(hexbinSend);
    // map.fitBounds(e.target.getBounds());
}

function highlightFeature(e) {
    var layer = e.target;
    var color = layer.feature._withCount.fillColor;
    layer.setStyle({
        weight: 5,
        color: color,
        dashArray: '',
        fillOpacity: 0.7
    });
    if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront();
    }
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
var ZoominMap = L.map('ZoominMap', {
    center: [1.35, 103.8],
    zoom: 11,
    layers: [OpenStreetMap_BlackAndWhiteZoomin, OpenStreetMap_MapnikZoomin, Hydda_FullZoomin]
});
L.control.layers(baseMapsZoomin).addTo(ZoominMap);


function FocusHexbin(hexbinSend) {

    var dataSend = JSON.stringify(hexbinSend);
    // console.log(dataSend);
    $.ajax({
        url: '/getHexbinContainHDBs',
        type: 'POST',
        data: dataSend,
        contentType: 'application/json',

        success: function(data) {
            // console.log(data);
            var HDBPoints = data.HDBPoints;
            var hexbinPoint = data.hexbin;
            L.geoJson(HDBPoints, {
                pointToLayer: function(feature, latlng) {
                    var propertyObject = feature.properties;
                    var property = "";
                    for (var key in propertyObject) {
                        if (propertyObject.hasOwnProperty(key)) {
                            property += "<p><b>" + key + "</b>" + " : " + propertyObject[key] + "</p>";
                        }
                    }
                    return L.circleMarker(latlng, {
                        radius: 5,
                        fillColor: '#000000',
                        fillOpacity: 1,
                        stroke: false
                    }).bindPopup(property);;
                }
            }).addTo(ZoominMap);
            var Hexbinstyle = {
                weight: 2,
                color: '#000000',
                fillOpacity: 0
            }
            var hexbinMap = L.Proj.geoJson(hexbinPoint, {
                style: Hexbinstyle
            }).addTo(ZoominMap);
            ZoominMap.fitBounds(hexbinMap.getBounds());


        }
    });


}

// function zoomToFeatureZoomin(e) {
//     var hexbinSend = e.target.feature;
//     map.fitBounds(e.target.getBounds());
// }

// function onEachFeatureZoomin(feature, layer) {
//     layer.on({
//         mouseover: highlightFeature,
//         mouseout: resetHighlight,
//         click: zoomToFeature
//     });
// }



// var HDBpoints = data.points;
// console.log(HDBpoints);
// // L.Proj.geoJson(grid, {
// //     // onEachFeature: onEachFeature,
// //     style: styleZoomin
// // }).addTo(ZoominMap);

// L.geoJson(HDBpoints, {
//     pointToLayer: function(feature, latlng) {
//         return L.circleMarker(latlng, {
//             radius: 0.5,
//             fillColor: '#ffffff',
//             fillOpacity: 1,
//             stroke: false
//         });
//     }
// }).addTo(ZoominMap);


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
// var li = $('li')
$(document).ready(function() {
        $('.hexbin').change(function() {
            var colors = $('#items').val();
            var methods = $('#methods').val();
            console.log(colors + " " + methods);
            GetHexbinVisualisation("p1", colors, methods)
             legend.removeFrom(map);

        })
    })
    // li.appendTo(".colors")
    // =======================================================End Second Map========================================
