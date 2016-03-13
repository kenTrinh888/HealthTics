$(document).ready(function() {
    var allKPIs = JSON.parse(getAllKPIs());
    populateBulletChart(allKPIs);
    visualizeBulletChart(allKPIs);
})

function visualizeBulletChart(allKPIs) {
    $('.visualize').click(function() {
        var bulletChartID = parseInt($(this).attr('id').split('_')[1]) - 1;
        var requirements = allKPIs[bulletChartID];
        console.log(requirements);
        // GetHexbinVisualisation(kpiName, "OrRd", "equal_interval");
        // $.ajax({
        //     type: 'POST',
        //     data: JSON.stringify(kpiName),
        //     contentType: 'application/json',
        //     url: 'http://localhost:3000/visualizeBulletChart'
        // });
    })
}

function populateBulletChart(allKPIs) {
    allKPIs.forEach(function(KPI, index) {
        if (index != allKPIs.length - 1) {
            addBulletChartRow(index);
        }
        $('#kpiName_' + (index + 1)).html(KPI.kpiName);
        $('#kpiNumber_' + (index + 1)).html(KPI.reqFinal.countSuccessDwellings);
        $('#kpiPercent_' + (index + 1)).html(KPI.reqFinal.percentPopulation);

        var bulletChartID = '#kpibulletchart_' + (index + 1) + ' svg';
        addBulletChart(bulletChartID, KPI);
    })
}

function addBulletChartRow(index) {
    var KPIRowHTML = "<tr id='KPIRow_" + (index + 2) + "' class='KPIRow'>\
                <td class='col-md-2'><span class='kpiName' id='kpiName_" + (index + 2) + "'></span></td>\
                <td class='col-md-7 bulletRow'><span class='kpibulletchart' id='kpibulletchart_" + (index + 2) + "'><svg></svg></span></td>\
                <td class='col-md-2'><span class='kpiNumber' id='kpiNumber_" + (index + 2) + "'></span></td>\
                <td class='col-md-2'><span class='kpiPercent' id='kpiPercent_" + (index + 2) + "'></span></td>\
                <td class='col-md-1'><button class='btn btn-primary visualize' id='visualize_" + (index + 2) + "'>Visualize</button></td>\
                <td class='col-md-1'><button class='btn btn-primary showDetail' id='showDetail_" + (index + 2) + "'>Show detail</button></td>\
                </tr>";
    $('#kpiListTbl tbody').append(KPIRowHTML);
}

function getAllKPIs() {
    getAllKPIurl = "/getAllKPIs";
    $.ajaxSetup({ async: false });
    var allKPIs = $.get(getAllKPIurl).responseText;
    $.ajaxSetup({ async: true });
    return allKPIs;
}

function addBulletChart(bulletChartID, KPI) {
    nv.addGraph(function() {
        var chart = nv.models.bulletChart();

        d3.select(bulletChartID)
            .datum(bulletChartData(KPI))
            .transition().duration(1000)
            .call(chart);

        return chart;
    });
}



function bulletChartData(KPI) {
    var measures = [];
    measures.push(KPI.reqFinal.percentPopulation);
    var markers = [];
    markers.push(KPI.targetKPI);
    return {
        "subtitle": "%", //sub-label for bullet chart
        "ranges": [30, 50, 100], //Minimum, mean and maximum values.
        "measures": measures, //Value representing current measurement (the thick blue line in the example)
        "markers": markers //Place a marker on the chart (the white triangle marker)
    };
}
