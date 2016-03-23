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
    zoomControl: false
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
var legend = L.control({ position: 'bottomright' });
var hasLegend = false;

function GetHexbinVisualisation(KPIJson, colors, method) {
    // $('#map').attr('name', KPIname)
    // console.log(KPIJson);
    if (hasLegend === true) {
        legend.removeFrom(map);
    }
    var controlOnject = layerControl._layers
    for (var key in controlOnject) {
        if (controlOnject.hasOwnProperty(key)) {
            delete controlOnject[key];
        }
    }
    if (colors === null) {
        colors = "OrRd";
    }
    if (method === null) {
        method = "equal_interval";
    }
    var data = getHexbinDataSync(KPIJson);
    // console.log(data);
    var grid = data.counted;
    var values = [];
    var brew = new classyBrew();
    // console.log(KPIJson);
    grid.features.forEach(function(cell) {
        cell["kpiName"] = KPIJson.kpiName
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
    }).addTo(map);
    layerControl.addOverlay(layerdata, "NewClass");

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
    console.log(data);
    return data;
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
    // console.log(KPIJson);
    var hexbinSend = e.target.feature;
    // console.log(hexbinSend);
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
var zone, ZoominMap = L.map('ZoominMap', {
    center: [1.35, 103.8],
    zoom: 11,
    layers: [OpenStreetMap_BlackAndWhiteZoomin, OpenStreetMap_MapnikZoomin, Hydda_FullZoomin],
    zoomControl: false
});
L.control.layers(baseMapsZoomin).addTo(ZoominMap);

function FocusHexbin(hexbinSend) {
    // console.log(KPIJson);
    var dataSend = JSON.stringify(hexbinSend);
    var data = $.ajax({
        url: '/getHexbinContainHDBs',
        type: 'POST',
        data: dataSend,
        contentType: 'application/json',
        async: false
    });
    dataJSON = data.responseJSON;
    // console.log(dataJSON);

    var HDBPoints = dataJSON.HDBPoints;
    var hexbinPoint = dataJSON.hexbin;
    var Hexbinstyle = {
        weight: 2,
        color: '#000000',
        fillOpacity: 0
    }

    var hexbinMap = L.Proj.geoJson(hexbinPoint, {
        style: Hexbinstyle
    }).addTo(ZoominMap);

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

    zone = L.Proj.geoJson(dataLayer, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                fillColor: "#708598",
                color: '#537898',
                weight: 1,
                fillOpacity: 0.6

            });
        }
    }).addTo(ZoominMap);
    updatePropSymbols();

} // end createPropSymbols()
function updatePropSymbols() {

    zone.eachLayer(function(layer) {

        // console.log(layer);
        var props = layer.feature.properties,
            radius = calcPropRadius(props.pt_count),
            popupContent =            "<b>POSTAL CODE: </b>" + props.POSTCODE + "</br><b>Accessible Facilities: </b>" + String(props.pt_count) + "<br>" ;
        // console.log(radius)
        layer.setRadius(radius);
        // layer.on('click', function(e) {
        //     alert(e.latlng); // e is an event object (MouseEvent in this case)
        // });
        // layer.bindPopup(popupContent).openPopup();
        layer.bindPopup(popupContent, {
            offset: new L.Point(0, -radius)
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

    var scaleFactor = 16, // value dependent upon particular data set
        area = attributeValue * scaleFactor;
    return Math.sqrt(area / Math.PI) * 2;

} // end calcPropRadius

// /-------End Display Propotional Map------------/