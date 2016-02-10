setLayersHTML(); //set layer list when page is loaded
// setSubLayersHTML();
function setLayersHTML() {
    getLayerAPI = "/getAllLayerColumnName";
    // $('.tree').treed();  
    $.get(getLayerAPI, function(layers, err) {
        if (layers) {
            console.log(layers);
            var layersTrimmed = []; //fix here
            layers.forEach(function(layer) {
                layerName = layer.name.split('.')[0]; //remove .geojson extension
                layersTrimmed.push(layerName); //fix here
                var listHTML = "<li class='node' id='" + layerName + "'>\
                                    " + layerName + "\
                                    <select class='columns' id='" + layerName + "_col'>\
                                        <option></option>\
                                    </select>\
                                </li>\
                                ";
                $('.tree').append(listHTML); //set layers to html
                //set columns

                layer.columns.forEach(function(column) {
                    var columnHTML = "<option>" + column + "</option>"
                    $('#' + layerName + '_col   ').append(columnHTML);
                });
            });
            // setLayerDropdownlist(layersTrimmed); //fix here
        };
        setSubLayersAndHiddenDiv(); //set hidden div with sublayer values

        var allLayers = getAllLayers();
        setLayerDropdownlist(1, allLayers); //set the first row of dropdownlist
    });
    $('.tree').treed();
};

function setSubLayersAndHiddenDiv() {
    $('.columns').ready(function() { //columns element is the column drop down list
        $('.columns').change(function() {
            var parentNode = $(this).parent('li').attr('id'); //the layer selected e.g. RelaxSG
            $('#' + parentNode).children('ul').remove();
            $('#' + parentNode).append('<ul></ul>');
            console.log("a");
            

            var dropDownID = $(this).attr('id');
            var selectedColumn = $('#' + dropDownID + " option:selected").text();
            if (selectedColumn!=""){
                callApiSetHiddenDiv(parentNode, selectedColumn); //also set hidden <div> with id:#hiddenColumnValues
            }else{
                $('#hiddenColumnValues').empty();
                setFilterTableDropdown();
            }
            
        });
    });
};

function setSubLayersHTML(subLayers, parentNode) {
    subLayers.forEach(function(subLayer) {
        var childNodeHTML = "<li class='node' id='" + subLayer + "'>\
                               " + subLayer + "</span>\
                           </li>";
        $('#' + parentNode).children('ul').append(childNodeHTML);
    });            
}

function setFilterTableDropdown(){
    //Modify Combobox dropdownlist
    var allLayers = getAllLayers();
    // console.log(allLayers);
    layerDropdownObjects.forEach(function(dropdownObject) {
        dropdownObject.setData([]);
        dropdownObject.setData(allLayers);
    })
}

function callApiSetHiddenDiv(parentNode, selectedColumn) {
    getColumnValuesAPI = "/getAllLayerColumnValues/" + parentNode + "/" + selectedColumn;
    // console.log(getColumnValuesAPI);
    var columnValues = [];
    $.ajax(getColumnValuesAPI, {
        // success: setColumnValuesHidden
        success: function(subLayers){
            // console.log(data);
            console.log(parentNode);
            setSubLayersHTML(subLayers, parentNode);
            setFilterTableDropdown();
        }
    })
}

function getAllLayers() {
    var allLayers = []; //clear initial list;
    $('.node').each(function() {
        layerName = $(this).attr('id');
        allLayers.push(layerName);
    });
    return allLayers;
}