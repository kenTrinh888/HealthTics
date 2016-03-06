//global variables
var modifiedRequirements = [];

//main method
$(document).ready(function() {
    setAndTable();
    loadAndTableData();
})

function sendModifiedRequirements(modifiedRequirements){
    $('.andTableSubmit').click(function(e){
        e.preventDefault();
        console.log(modifiedRequirements);
        $.ajax({
            type: 'POST',
            data: JSON.stringify(modifiedRequirements),
            contentType: 'application/json',
            url: 'http://localhost:3000/sendModifiedRequirements',
            success: function(data) {
                // console.log('success');
                // console.log(data);
            }
        });
        location.reload();
    });   
}

function setAndTable() {
    var andTableSelector = $('#andTbl');
    var andTable = andTableSelector.DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false
    });
    var andTableRowCount = 2;
    deleteRow(andTable, andTableSelector, "#deleteResultRow");
    addRow(andTable, andTableRowCount, '#addResultRow');
}

function loadAndTableData() {
    var getDataAPI = '/getNumberofHDB';
    $.get(getDataAPI, function(HDBData, err) {
        if (err) {
            console.log(err);
        }
        var reqStrings = [];
        var requirements = getRequirements(HDBData);
        modifiedRequirements = modifyRequirements(requirements);
        // console.log(modifiedRequirements);
        // sendModifiedRequirements(modifiedRequirements)
        populateAndTable(modifiedRequirements);
    })
}

function modifyRequirements(requirements) {
    requirements.forEach(function(reqObject, index) {
        var countSuccessHDB = reqObject.success_HDB_JSONs.length;
        var countFailedHDB = reqObject.failed_HDB_JSONs.length;
        var countAllHDB = countSuccessHDB + countFailedHDB;
        var countSuccessDwellings = 0;
        var countFailedDwellings = 0;
        if (countSuccessHDB > 0) {
            reqObject.success_HDB_JSONs.forEach(function(HDB_JSON, index) {
                countSuccessDwellings += HDB_JSON.properties.DwellingUnits;
            });
        }
        if (countFailedHDB > 0) {
            reqObject.failed_HDB_JSONs.forEach(function(HDB_JSON, index) {
                countFailedDwellings += HDB_JSON.properties.DwellingUnits;
            });
        }
        reqObject.countSuccessDwellings = countSuccessDwellings;
        reqObject.countFailedDwellings = countFailedDwellings;
        reqObject.countSuccessHDB = countSuccessHDB;
        reqObject.countFailedHDB = countFailedHDB;
        reqObject.countAllHDB = countSuccessHDB + countFailedHDB;
        reqObject.percentPopulation = (countSuccessHDB / countAllHDB) * 100;
    });
    return requirements;
}

function getRequirements(HDBData) {
    var requirements = [];
    HDBData.forEach(function(HDBs, HDBsIndex) {
        var reqObject = {};
        reqObject.directory = HDBs.directory;
        HDBs.bigORs.forEach(function(HDB, HDBindex) {
            if (HDBindex == 0) {
                var ORRequirements = HDB.ORREquirement;
                var reqString = getReqString(ORRequirements);
                reqObject.reqString = reqString;
                reqObject.success_HDB_JSONs = [];
                reqObject.failed_HDB_JSONs = [];
            }
            if (HDB.totalRequirement == true) {
                reqObject.success_HDB_JSONs.push(HDB.HDB_JSON)
            } else {
                reqObject.failed_HDB_JSONs.push(HDB.HDB_JSON)
            }
        });
        requirements.push(reqObject);
    });

    return requirements;
}

function getReqString(ORRequirements) {
    var reqString = "";
    ORRequirements.forEach(function(req, index) {
        reqDescription = req.requirement_description;
        var toExcludeList = ["parentLayer", "sublayer_column"];
        for (var prop in reqDescription) {
            if (prop == "within_range") {
                reqString = reqString + " within " + reqDescription[prop] + " meter";
            } else {
                if (toExcludeList.indexOf(prop) == -1)
                    reqString = reqString + " " + reqDescription[prop];
            }
        }
        if (index != ORRequirements.length - 1) {
            reqString = reqString + " OR<br>";
        }
    });
    return reqString;
}

function populateAndTable(modifiedRequirements) {
    modifiedRequirements.forEach(function(reqObject, index) {
        var lastRow = $('.andTbl tbody tr').length;
        $('#filterCondition_' + lastRow).html(reqObject.reqString);
        $('#hdbCount_' + lastRow).html(reqObject.countSuccessHDB);
        $('#dwellingUnits_' + lastRow).html(reqObject.countSuccessDwellings);
        $('#percentPopulation_' + lastRow).html(reqObject.percentPopulation + " %");
        if (lastRow < modifiedRequirements.length) {
            doAddRow('#addResultRow');
        }
    })
}

function deleteRow(table, tableSelector, deleteType) {

    tableSelector.children('tbody').on('click', 'tr', function() {

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $(deleteType).click(function() {
        if (table.rows().count() == 1) {
            alert("error: unable to delete row");
            return;
        }
        table.row('.selected').remove().draw(false);
    });
}

function addRow(table, rowCount, addType) {
    $(addType).on('click', function(e) {
        // e.preventDefault();
        var emptyArr = [];
        table.row.add([
            "<input type='checkbox' name='test' value='test' class='form-control'>",
            "<span class='filterCondition' id='filterCondition_" + rowCount + "'></span>",
            "<span class='hdbCount' id='hdbCount_" + rowCount + "'</span>",
            "<span class='dwellingUnits' id='dwellingUnits_" + rowCount + "'></span>",
            "<span class='percentPopulation' id='percentPopulation_" + rowCount + "'></span>"
        ]).draw(false); //add the new row without redrawing the whole table
        var allLayers = getAllLayers();
        setLayerDropdownlist(rowCount, allLayers);

        rowCount++;
    });
}

function doAddRow(andTableSelector) {
    $(andTableSelector).click();
}
