$(document).ready(function() {
    var allKPIs = JSON.parse(getAllKPIs());

    populateBulletChart(allKPIs);
    visualizeBulletChart(allKPIs);
    // console.log(KPIJson);

    populateDetailBulletChart(allKPIs);
})

function visualizeBulletChart(allKPIs) {

    $('.visualize').click(function() {
        var bulletChartID = parseInt($(this).attr('id').split('_')[1]) - 1;
        var KPIJson = allKPIs[bulletChartID];

        // GetHexbinVisualisation(requirements)
        // console.log(KPIJson);
        GetHexbinVisualisation(KPIJson, "OrRd", "equal_interval");
        changeHexBinAlgo(KPIJson);
    })
}

function visualizeDetailBulletChart(allKPIs, parentID) {
    $('.detailkpiVisualize').click(function() {
        // console.log('a');
        var andTableID = parseInt($(this).attr('id').split('_')[1]) - 1;
        var KPIJson = { "reqFinal": allKPIs[parentID].andTable[andTableID] };
        GetHexbinVisualisation(KPIJson, "OrRd", "equal_interval");
        changeHexBinAlgo(KPIJson);
        // console.log(requirements);
    })
}

function populateBulletChart(allKPIs) {
    // console.log(allKPIs);
    allKPIs.forEach(function(KPI, index) {
        if (index != allKPIs.length - 1) {
            addBulletChartRow(index);
        }
        var targetKpiNumber = +(KPI.targetKPI/100 * KPI.reqFinal.countAllDwellings).toFixed(0);
        $('#totalPopulation_' + (index + 1)).html(KPI.reqFinal.countAllDwellings);
        $('#targetKpiNumber_' + (index + 1)).html(targetKpiNumber);
        $('#kpiName_' + (index + 1)).html(KPI.kpiName);
        $('#kpiNumber_' + (index + 1)).html(KPI.reqFinal.countSuccessDwellings);
        $('#kpiPercent_' + (index + 1)).html(KPI.reqFinal.percentPopulation);

        var bulletChartID = '#kpibulletchart_' + (index + 1) + ' svg';
        addBulletChart(bulletChartID, KPI);

    })
}

function setTargetNumber(KPI) {
    var isDragging = false;
    $(".nv-markerTriangle")
        .mousedown(function() {
            isDragging = false;
        })
        .mousemove(function() {
            isDragging = true;
        })
        .mouseup(function() {
            var wasDragging = isDragging;
            isDragging = false;
            if (!wasDragging) {
                console.log('draggeeeeee');
                $("#throbble").toggle();
            }
        });
}

function populateDetailBulletChart(allKPIs) {
    $('.showDetail').click(function() {
        var rowID = $(this).attr('id').split('_')[1];
        $('.KPIRow').each(function() {
            $(this).hide();
        });
        $('#KPIRow_' + rowID).show();
        $('#KPIRow_' + rowID).find('.showDetail').attr('disabled', 'disabled');
        var parentID = rowID - 1; //for sending visualization of detailed KPI;
        allKPIs.forEach(function(KPI, i) {
            if (i == rowID - 1) {
                KPI.andTable.forEach(function(andTableKPI, index) {
                    if (index != KPI.andTable.length) {
                        addDetailBulletChartRow(index);
                    }
                    $('#detailkpiName_' + (index + 1)).html(andTableKPI.reqString);
                    $('#detailkpiNumber_' + (index + 1)).html(andTableKPI.countSuccessDwellings);
                    $('#detailkpiPercent_' + (index + 1)).html(andTableKPI.percentPopulation);

                    var bulletChartID = '#detailkpibulletchart_' + (index + 1) + ' svg';
                    addDetailBulletChart(bulletChartID, andTableKPI);
                })
            }

        })
        visualizeDetailBulletChart(allKPIs, parentID);

        repopulateBulletChart();
    });
}

function repopulateBulletChart() {
    $('.backToKPIList').click(function() {
        $('.detailKPIRow').remove();
        $('.KPIRow').show();
        // var rowID = $(this).attr('id').split('_')[1];
        $('.KPIRow').each(function() {
            $(this).find('.showDetail').removeAttr('disabled')
        })
    })
}

function addBulletChartRow(index) {
    var KPIRowHTML = "<tr id='KPIRow_" + (index + 2) + "' class='KPIRow'>\
                <td class='col-md-1'><span class='kpiName' id='kpiName_" + (index + 2) + "'></span></td>\
                <td class='col-md-6 bulletRow'><span class='kpibulletchart' id='kpibulletchart_" + (index + 2) + "'><svg></svg></span></td>\
                <td class='col-md-1'><span class='kpiNumber' id='kpiNumber_" + (index + 2) + "'></span></td>\
                <td class='col-md-1'><span class='kpiPercent' id='kpiPercent_" + (index + 2) + "'></span></td>\
                <td class='col-md-1'>\
                  <span class='targetKpiNumber' id='targetKpiNumber_" + (index + 2) + "'></span>\
                  <span class='totalPopulation' style='display:none' id='totalPopulation_" + (index + 2) + "'></span>\
                </td>\
                <td class='col-md-1'><button class='btn btn-primary visualize' id='visualize_" + (index + 2) + "'>Visualize</button></td>\
                <td class='col-md-1'><button class='btn btn-primary showDetail' id='showDetail_" + (index + 2) + "'>Show detail</button></td>\
                </tr>";
    $('#kpiListTbl tbody').append(KPIRowHTML);
}

function addDetailBulletChartRow(index) {
    var KPIRowHTML = "<tr id='detailKPIRow_" + (index + 1) + "' class='detailKPIRow'>\
              <td class='col-md-1'><span class='detailkpiName' id='detailkpiName_" + (index + 1) + "'></span></td>\
              <td class='col-md-6 bulletRow'><span class='detailkpibulletchart' id='detailkpibulletchart_" + (index + 1) + "'><svg></svg></span></td>\
              <td class='col-md-1'><span class='detailkpiNumber' id='detailkpiNumber_" + (index + 1) + "'></span></td>\
              <td class='col-md-1'><span class='detailkpiPercent' id='detailkpiPercent_" + (index + 1) + "'></span></td>\
              <td class='col-md-1'>\
                <span class='detailtargetKpiNumber' id='detailtargetKpiNumber_" + (index + 1) + "'></span>\
                <span class='detailtotalPopulation' style='display:none' id='detailtotalPopulation_" + (index + 1) + "'></span>\
              </td>\
              <td class='col-md-1'><button class='btn btn-primary detailkpiVisualize' id='visualize_" + (index + 1) + "'>Visualize</button></td>\
              <td class='col-md-1'><button class='btn btn-primary backToKPIList' id='backToKPIList_" + (index + 1) + "'>Back to KPI list</button></td>\
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

function addDetailBulletChart(bulletChartID, andTableKPI) {
    nv.addGraph(function() {
        var chart = nv.models.bulletChart();

        d3.select(bulletChartID)
            .datum(detailBulletChartData(andTableKPI))
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

function detailBulletChartData(andTableKPI) {
    var measures = [];
    measures.push(andTableKPI.percentPopulation);
    return {
        "subtitle": "%", //sub-label for bullet chart
        "ranges": [30, 50, 100], //Minimum, mean and maximum values.
        "measures": measures //Value representing current measurement (the thick blue line in the example)
            // "markers": markers //Place a marker on the chart (the white triangle marker)
    };
}