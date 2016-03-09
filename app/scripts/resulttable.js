//main method
$(document).ready(function() {
    loadResultTableData();
})

function getCheckedFileDirectories(){
    $('#')
}

function loadResultTableData() {
    var getDataAPI = '/getNumberofHDB';
    $.get(getDataAPI, function(HDBData, err) {
        if(HDBData.length==0){
            return;
        }
        if (err) {
            console.log(err);
        }
        var reqStrings = [];
        var requirements = getResultRequirements(HDBData);
        var finalRequirements = getFinalRequirements(requirements);
        sendFinalRequirements(finalRequirements);
        populateResultTable(finalRequirements);
    })
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

    // console.log(requirements);
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
    // console.log(requirements);
    return requirements;
}

function countAllDwellings(HDBData) {
    var countAllDwellings = 0;
    if(HDBData.length==0){
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

function sendFinalRequirements(finalRequirements) {
    $('.andTableSubmit').click(function(e) {
        e.preventDefault();
        // console.log(finalRequirements);
        $.ajax({
            type: 'POST',
            data: JSON.stringify(finalRequirements),
            contentType: 'application/json',
            url: 'http://localhost:3000/sendFinalRequirements',
            success: function(data) {
                // console.log('success');
                // console.log(data);
            }
        });
        location.reload();
    });
}


function populateResultTable(finalRequirements) {
    // console.log(finalRequirements);

    $('.countSuccessDwellings').html(finalRequirements.reqFinal.countSuccessDwellings);
    $('.percentPopulation').html(finalRequirements.reqFinal.percentPopulation + "%");
}
