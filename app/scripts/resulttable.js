//main method
$(document).ready(function() {
    UpdateloadResultTableDataWithIndexes()
    triggerSaveButtonInModal();
    loadResultTableData();
    sendFinalRequirements();
    refreshResultTableDataWithIndexes();
})

function getCheckedFileIndexes() {
    var fileIndexes = "";
    $('.AND_checkbox').each(function() {
        var isChecked = $(this).prop('checked');

        if (isChecked) {
            var fileIndex = $(this).attr('id').split('_')[2];
            fileIndexes += fileIndex + ";";
        }
    });
    fileIndexes.slice(fileIndexes.length-1);
    return fileIndexes;
}

function loadResultTableData() {
    var getDataAPI = '/getNumberofHDB/';
    $.get(getDataAPI, function(HDBData, err) {
        if (HDBData.length == 0) {
            return;
        }
        if (err) {
            // console.log(err);
        }
        var reqStrings = [];
        var requirements = getResultRequirements(HDBData);
        var finalRequirements = getFinalRequirements(requirements);
        populateResultTable(finalRequirements);
    })
}

function sendFinalRequirements() {
    $('.andTableSubmit').change(function(e) {
        e.preventDefault();
        loadResultTableDataWithIndexes();
    });
}

function refreshResultTableDataWithIndexes(){
    $('.updateKPI').click(function(){
        var fileIndexes = getCheckedFileIndexes();
        // console.log(fileIndexes);
        var kpiName = "refresh";
        // var targetKPI = $('.targetKPI').prop('value');
        var targetKPI = 90;
        if (fileIndexes.length == 0) {
            alert('error: please tick at least one checkbox');
            return;
        }
        if (kpiName.length == 0) {
            alert('error: please input KPI name');
            return;
        }
        if (targetKPI.length == 0) {
            alert('error: please input target KPI');
            return;
        }
        var getDataAPI = '/getNumberofHDB2/' + fileIndexes;
        $.get(getDataAPI, function(HDBData, err) {
            // console.log(HDBData);
            if (HDBData.length == 0) {
                return;
            }
            if (err) {
                // console.log(err);
            }
            var reqStrings = [];
            var requirements = getResultRequirements(HDBData);
            var finalRequirements = getFinalRequirements(requirements);
            finalRequirements = addAndTableToFinalRequirements(finalRequirements, fileIndexes);
            finalRequirements.kpiName = kpiName;
            finalRequirements.targetKPI = targetKPI;
            populateResultTable(finalRequirements);
        });
    })
}
function loadResultTableDataWithIndexes() {
    var fileIndexes = getCheckedFileIndexes();
    console.log(fileIndexes);
    var kpiName = $('.kpiName').prop('value');
    // var targetKPI = $('.targetKPI').prop('value');
    var targetKPI = 90;
    if (fileIndexes.length == 0) {
        alert('error: please tick at least one checkbox');
        return;
    }
    if (kpiName.length == 0) {
        alert('error: please input KPI name');
        return;
    }
    if (targetKPI.length == 0) {
        alert('error: please input target KPI');
        return;
    }
    var getDataAPI = '/getNumberofHDB2/' + fileIndexes;


    $.get(getDataAPI, function(HDBData, err) {
          console.log(HDBData);
        if (HDBData.length == 0) {
            return;
        }
        if (err) {
            console.log(err);
        }
        var reqStrings = [];
        var requirements = getResultRequirements(HDBData);
        var finalRequirements = getFinalRequirements(requirements);
        finalRequirements = addAndTableToFinalRequirements(finalRequirements, fileIndexes);
        finalRequirements.kpiName = kpiName;
        finalRequirements.targetKPI = targetKPI;

        $.ajaxSetup({ async: false });
        var fileExists = $.get('checkFileExists/' + kpiName).responseText;
        $.ajaxSetup({ async: true });
        if (fileExists == 'true') {
            var confirmed = confirm("File already exists. Overwrite file?");
            if (confirmed) {
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(finalRequirements),
                    contentType: 'application/json',
                    url: 'http://localhost:3000/sendFinalRequirements'
                });
            }
        } else {
            $.ajax({
                type: 'POST',
                data: JSON.stringify(finalRequirements),
                contentType: 'application/json',
                url: 'http://localhost:3000/sendFinalRequirements'
            });
        }
        populateResultTable(finalRequirements);
        $('#modal-updateAndTable').modal('hide');
        $('.kpiName').prop('value', '');
    })
}

function UpdateloadResultTableDataWithIndexes(){
    $.get("/allFinalResult", function(KPIFilesArray){
        for(var m in KPIFilesArray){
            var aKPIFiles = KPIFilesArray[m];
            var HDBData = aKPIFiles.bigORsArray;
            var KPIContent = aKPIFiles.KPIContent;
            var requirements = getResultRequirements(HDBData);
            var finalRequirements = getFinalRequirements(requirements);
            KPIContent.reqFinal = finalRequirements.reqFinal;
            KPIContent.reqData = finalRequirements.reqData;
            $.ajax({
                type: 'POST',
                data: JSON.stringify(KPIContent),
                contentType: 'application/json',
                url: 'http://localhost:3000/sendFinalRequirements'
            });
        } 
    })
}

function addAndTableToFinalRequirements(requirements, fileIndexes) {
    var finalRequirements = requirements;
    finalRequirements.andTable = [];
    var targetKPI = 90;
    var andTable = JSON.parse($('.modifiedRequirements').text());
    // console.log(andTable);
    var fileIndex = 0;
    andTable.forEach(function(element, index) {
        // console.log(element);
        // console.log(index);
        if (fileIndexes.indexOf(String(index + 1)) != -1) {
            finalRequirements.andTable.push(element);
            finalRequirements.andTable[fileIndex].targetKPI = targetKPI;
            fileIndex++;
        }
    })
    
    // console.log(finalRequirements.andTable);
    return finalRequirements;
}

function getResultRequirements(HDBData) {
    var requirements = {};
    var success_HDB_JSONs = [];
    var failedArr = [];
    requirements.reqFinal = {};
    requirements.reqData = [];
    requirements.reqFinal.countAllDwellings = countAllDwellings(HDBData);
    requirements.reqFinal.countAllHDB = HDBData[0].bigORs.length;
    HDBData.forEach(function(HDBs, HDBsIndex) {
        var reqObject = {};
        reqObject.directory = HDBs.directory;
        HDBs.bigORs.forEach(function(HDB, HDBindex) {
            if (HDBindex == 0) {
                var ORRequirements = HDB.ORREquirement;
                reqObject.ORRequirements = ORRequirements;
                var reqString = getResultReqString(ORRequirements);
                reqObject.reqString = reqString;
            }
            if (HDB.totalRequirement == false) {
                if (failedArr.indexOf(HDBindex) == -1) {
                    failedArr.push(HDBindex);
                }
            }
            if (HDBsIndex == HDBData.length - 1) {
                if (failedArr.indexOf(HDBindex) == -1) {
                    success_HDB_JSONs.push(HDB.HDB_JSON);
                }
            }
        });
        requirements.reqData.push(reqObject);
    });
    requirements.reqFinal.success_HDB_JSONs = success_HDB_JSONs;
    requirements.reqFinal.failed_HDB_JSONs = failedArr;
    return requirements;
}

function getFinalRequirements(requirements) {
    requirements.reqFinal.countSuccessHDB = requirements.reqFinal.success_HDB_JSONs.length;
    requirements.reqFinal.countSuccessDwellings = 0;
    requirements.reqFinal.success_HDB_JSONs.forEach(function(HDB_JSON, index) {
        requirements.reqFinal.countSuccessDwellings += HDB_JSON.properties.DwellingUnits;
    });
    requirements.reqFinal.percentPopulation = requirements.reqFinal.countSuccessDwellings / requirements.reqFinal.countAllDwellings * 100
    requirements.reqFinal.percentPopulation = +requirements.reqFinal.percentPopulation.toFixed(2);
    return requirements;
}

function countAllDwellings(HDBData) {
    var countAllDwellings = 0;
    if (HDBData.length == 0) {
        return 0;
    }

    HDBData[0].bigORs.forEach(function(bigOR, index) {
        countAllDwellings += bigOR.HDB_JSON.properties.DwellingUnits
    });
    return countAllDwellings;
}

function getResultReqString(ORRequirements) {
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

function populateResultTable(finalRequirements) {
    // console.log(finalRequirements);

    $('.countSuccessDwellings').html(finalRequirements.reqFinal.countSuccessDwellings);
    $('.percentPopulation').html(finalRequirements.reqFinal.percentPopulation + "%");
}

function triggerSaveButtonInModal() {
    $('.kpiName').keypress(function(e) {
        if (e.keyCode == 13) {
            $('.andTableSubmit').click();
        }
    });
}