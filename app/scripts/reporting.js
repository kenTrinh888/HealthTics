L.Icon.Default.imagePath = '/images';
L.AwesomeMarkers.Icon.prototype.options.prefix = 'ion';
/* create leaflet map */
var map = L.map('map', {
    center: [1.35, 103.8],
    zoom: 12
});
new L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 0,
    maxZoom: 50,
    attribution: 'Map data © <a href="http://www.openstreetmap.org">OpenStreetMap contributors</a>'
}).addTo(map);
var layerGroup = L.layerGroup().addTo(map);
var layerControl = false;
$.getJSON("/getHexbinVisualGeojson", function(data) {
    var grid = data;
    var values = [];
    var brew = new classyBrew();

    grid.features.forEach(function(cell) {

        var pt_count = cell.properties.pt_count;
        values.push(pt_count);


        // var _withCount = cell._withCount = {};
        // // _withCount.color = '#550000';
        // _withCount.weight = 0;
        // // _withCount.fill = '#550000';
        // _withCount.fillOpacity = 0;
        // _withCount.fillColor = brew.getColorInRange(pt_count)

        // if (pt_count >= 1) {
        //     _withCount.fillOpacity = 0.1;
        // }
        // if (pt_count >= 5) {

        //     _withCount.fillOpacity = 0.2;
        //     _withCount.weight = 1;
        // }
        // if (pt_count >= 7) {
        //     _withCount.weight = 2;
        //     _withCount.fillOpacity = 0.35;
        // }
        // if (pt_count >= 75) {
        //     _withCount.weight = 3;
        //     _withCount.fillOpacity = 0.55;
        // }
    });




    // console.log(values);
    brew.setSeries(values);

    // define number of classes
    brew.setNumClasses(7);
    // pass array to our classybrew series
    var breaks = brew.getBreaks();
    console.log(breaks);
    // set color ramp code
    brew.setColorCode('YlGnBu'); // set color code

    // classify by passing in statistical method
    // i.e. equal_interval, jenks, quantile
    brew.classify("equal_interval");
    var colors = brew.getColors();
    // var colorinRange = brew.getColorInRange(7.5);
    // console.log(colorinRange);

    grid.features.forEach(function(cell) {

        var pt_count = cell.properties.pt_count;

        var _withCount = cell._withCount = {};
        // _withCount.color = '#550000';
        // _withCount.weight = 0;
        // _withCount.fill = '#550000';
        // _withCount.fillOpacity = 0;

        _withCount.fillColor = brew.getColorInRange(pt_count)
        var WO = assignWeightandOpacity(pt_count,breaks);
        var weight = WO.split(",")[0];
        var fillOpacity = WO.split(",")[1];
        _withCount.fillOpacity = fillOpacity;
        _withCount.weight = weight;
       
    })






    // console.log(grid);
    layerdata = L.Proj.geoJson(grid, {
        onEachFeature: onEachFeature,
        style: style
    }).addTo(map);
    if (layerControl === false) {
        layerControl = L.control.layers().addTo(map);
    }
    layerControl.addOverlay(layerdata, "Hexbin");




})

function assignWeightandOpacity(pointcount,breaks){
	var weight = 0;
	var fillOpacity = 0;
	for (var m = 0; m < breaks.length;m++){
		var aBreak = breaks[m];
		var newWeight = m + 1;
		var newOpacity = m/10;
		if(pointcount>aBreak){
			weight = newWeight;
			fillOpacity = newOpacity
		}
	}
	return weight + "," + fillOpacity;
}
function style(feature) {
    // console.log(feature._withCount);
    return feature._withCount
        // return {
        //     fillColor: brew.getColorInRange(feature.properties.pt_count),
        //     weight: 2,
        //     opacity: 1,
        //     color: 'white',
        //     dashArray: '3',
        //     fillOpacity: 0.7
        // };
}


function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
// add interaction


function resetHighlight(e) {
    layerdata.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function highlightFeature(e) {
    var layer = e.target;
   
    var color = layer.feature._withCount.fillColor;
    console.log(layer.feature.properties.pt_count)
     // console.log(color);
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
var info = L.control();

info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {

    var value = props ? props.AveragedWins : null;
    // console.log(value);
    if (value === null) {
        this._div.innerHTML = '<h4>Average Gp1&Gp2 Wins</h4>' + (props ?
            '<b> Zone:</b>' + props.DGPZ_NAME + '<br />' + '<b> SubZone:</b>' + props.DGPSZ_NAME + '<br />' + "0" + ' win' : 'Hover over a zone');
    } else {
        this._div.innerHTML = '<h4>Average Gp1&Gp2 Wins</h4>' + (props ?
            '<b> Zone:</b>' + props.DGPZ_NAME + '<br />' + '<b> SubZone:</b>' + props.DGPSZ_NAME + '<br />' + props.AveragedWins + ' win' : 'Hover over a zone');
    }

};

info.addTo(map);
