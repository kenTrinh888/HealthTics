$body = $("body");
$(document).on({
    ajaxStart: function() { $body.addClass("loading"); },
    ajaxStop: function() { $body.removeClass("loading"); }
});


$(document).ready(function() {
    var allKPIs = JSON.parse(getAllKPIs());
    // console.log(allKPIs);
    populateBulletChart(allKPIs);
    visualizeBulletChart(allKPIs);
    populateDetailBulletChart(allKPIs);

    var kpiTableSelector = $('#kpiListTbl');
    var kpiTable = kpiTableSelector.DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false
    });
    deleteKPIRow(kpiTable, kpiTableSelector, "#deleteKPIRow", allKPIs);
})

function deleteKPIRow(table, tableSelector, deleteType, allKPIs) {
    tableSelector.children('tbody').on('click', 'tr', function(e) {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });
    $(deleteType).on('click', function(e) {
        var selectedRow = table.row('.selected');
        var selectedRowIndex = selectedRow.index();
        if (selectedRowIndex === undefined || selectedRowIndex === null) {
            alert('ERROR: please click on a row before deleting it');
            return;
        }
        deleteKPIFile(selectedRowIndex, allKPIs);
        selectedRow.remove().draw(false);
    });
}

function deleteKPIFile(selectedRowIndex, allKPIs) {
    var fileToDelete = {};
    selectedFile = {kpiName: allKPIs[selectedRowIndex].kpiName};
    console.log(selectedFile);
    $.ajax({
        type: 'POST',
        data: JSON.stringify(selectedFile),
        contentType: 'application/json',
        url: 'http://localhost:3000/deleteKPIFile',
        success: function(data) {
        }
    });
}

function visualizeBulletChart(allKPIs) {
    $('.visualize').click(function() {
        var bulletChartID = parseInt($(this).attr('id').split('_')[1]) - 1;
        var KPIJson = allKPIs[bulletChartID];
        $('#items').prop("disabled", false);
        $('#methods').prop("disabled", false);
        $("[name='maplegend']").bootstrapSwitch("disabled", false);
        $('#hexbinWidth').prop("disabled", false);
        $('#displayHDBs').prop("disabled", false);

        changeHDBDisplay(KPIJson);
        changeHexbinWidth(KPIJson);
        GetHexbinVisualisation(KPIJson, "OrRd", "equal_interval");
        changeHexBinAlgo(KPIJson);
    })
}

function visualizeDetailBulletChart(allKPIs, parentID) {
    $('.detailkpiVisualize').click(function() {
        $('#items').prop("disabled", false);
        $('#methods').prop("disabled", false);
        $("[name='maplegend']").bootstrapSwitch("disabled", false);
        $('#hexbinWidth').prop("disabled", false);

        var andTableID = parseInt($(this).attr('id').split('_')[1]) - 1;
        var KPIJson = { "reqFinal": allKPIs[parentID].andTable[andTableID], "kpiName": allKPIs[parentID].kpiName};
        $('#items').prop("disabled", false);
        $('#methods').prop("disabled", false);
        $("[name='maplegend']").bootstrapSwitch("disabled", false);
        $('#hexbinWidth').prop("disabled",false);
        $('#displayHDBs').prop("disabled", false);
        changeHDBDisplay(KPIJson);
        changeHexbinWidth(KPIJson);
        GetHexbinVisualisation(KPIJson, "OrRd", "equal_interval");
        changeHexBinAlgo(KPIJson);
    })
}

function populateBulletChart(allKPIs) {
    // console.log(allKPIs);
    allKPIs.forEach(function(KPI, index) {
        if (index != allKPIs.length - 1) {
            addBulletChartRow(index);
        }
        // console.log(typeof KPI.reqFinal.countAllDwellings);
        // if (typeof KPI.reqFinal.countAllDwellings != undefined) {
            var targetKpiNumber = +(KPI.targetKPI / 100 * KPI.reqFinal.countAllDwellings).toFixed(0);
            $('#totalPopulation_' + (index + 1)).html(KPI.reqFinal.countAllDwellings);
            $('#targetKpiNumber_' + (index + 1)).html(targetKpiNumber);
            $('#kpiName_' + (index + 1)).html(KPI.kpiName);
            $('#kpiNumber_' + (index + 1)).html(KPI.reqFinal.countSuccessDwellings);
            $('#kpiPercent_' + (index + 1)).html(KPI.reqFinal.percentPopulation);

            var bulletChartID = '#kpibulletchart_' + (index + 1) + ' svg';
            addBulletChart(bulletChartID, KPI);
        // }
    })
}


function populateDetailBulletChart(allKPIs) {
    $('.showDetail').click(function() {
        $('#deleteKPIRow').attr('disabled','disabled');
        var rowID = $(this).attr('id').split('_')[1];
        $('.KPIRow').each(function() {
            $(this).hide();
        });

        var kpiName = $('#kpiName_' + rowID).html();

        $.ajaxSetup({ async: false });
        var KPI = $.get('getCurrentKPI/' + kpiName).responseText;
        $.ajaxSetup({ async: true });
        KPI = JSON.parse(KPI);

        $('#KPIRow_' + rowID).show();
        $('#KPIRow_' + rowID).addClass('selectedKPIRow');
        $('#KPIRow_' + rowID).find('.showDetail').attr('disabled', 'disabled');
        var parentID = rowID - 1; //for sending visualization of detailed KPI;
        // allKPIs.forEach(function(KPI, i) {
        // console.log(KPI);
        // if (i == rowID - 1) {
        KPI.andTable.forEach(function(andTableKPI, index) {
                if (index != KPI.andTable.length) {
                    addDetailBulletChartRow(index);
                }
                var targetKpiNumber = +(andTableKPI.targetKPI / 100 * andTableKPI.countAllDwellings).toFixed(0);
                $('#detailkpiName_' + (index + 1)).html(andTableKPI.reqString);
                $('#detailkpiNumber_' + (index + 1)).html(andTableKPI.countSuccessDwellings);
                $('#detailkpiPercent_' + (index + 1)).html(andTableKPI.percentPopulation);
                $('#detailtotalPopulation_' + (index + 1)).html(KPI.reqFinal.countAllDwellings);
                $('#detailtargetKpiNumber_' + (index + 1)).html(targetKpiNumber);

                var bulletChartID = '#detailkpibulletchart_' + (index + 1) + ' svg';
                addDetailBulletChart(bulletChartID, andTableKPI);
            })
            // }

        // })
        visualizeDetailBulletChart(allKPIs, parentID);

        repopulateBulletChart();
    });
}

function repopulateBulletChart() {
    $('.backToKPIList').click(function() {
        $('#deleteKPIRow').removeAttr('disabled');
        $('.selectedKPIRow').removeClass('selectedKPIRow');
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
                  <span class='targetKpiPercent' style='display:none' id='targetKpiPercent_" + (index + 2) + "'></span>\
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
                <span class='detailtargetKpiPercent' style='display:none' id='detailtargetKpiPercent_" + (index + 1) + "'></span>\
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
    // console.log(andTableKPI);
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
    var markers = [];
    markers.push(andTableKPI.targetKPI);
    return {
        "subtitle": "%", //sub-label for bullet chart
        "ranges": [30, 50, 100], //Minimum, mean and maximum values.
        "measures": measures, //Value representing current measurement (the thick blue line in the example)
        "markers": markers // "markers": markers //Place a marker on the chart (the white triangle marker)
    };
}
