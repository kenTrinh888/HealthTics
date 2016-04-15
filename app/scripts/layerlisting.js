setLayersHTML(); //set layer list when page is loaded
// setSubLayersHTML();
function setLayersHTML() {
    getLayerAPI = "/getAllLayerColumnName";
    // $('.tree').treed();  
    $.get(getLayerAPI, function(layers, err) {
        if (layers) {
            // console.log(layers);
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
                    getColumnValuesAPI = "/getAllLayerColumnValues/" + layerName + "/" + column;
                    // console.log(getColumnValuesAPI);
                    var columnValues = [];
                    $.ajax(getColumnValuesAPI, {
                        success: function(subLayers) {
                            if(subLayers.length <= 9){
                                var columnHTML = "<option>" + column + "</option>"
                                $('#' + layerName + '_col   ').append(columnHTML);            
                            }
                        },
                        async: false
                    })
                    
                });
            });
            // setLayerDropdownlist(layersTrimmed); //fix here
        };
        callApiThenSetSubLayers(); //set hidden div with sublayer values

        var allLayers = getAllLayers();
        setLayerDropdownlist(1, allLayers); //set the first row of dropdownlist
        showNoValueInColumn();
    });
    $('.tree').treed();
};

function callApiThenSetSubLayers() {
    $('.columns').ready(function() { //columns element is the column drop down list
        $('.columns').change(function() {
            var parentNode = $(this).parent('li').attr('id'); //the layer selected e.g. RelaxSG
            
            $('#' + parentNode).children('ul').remove();
            $('#' + parentNode).append("<ul class='layerList_"+parentNode+"'></ul>");
            var dropDownID = $(this).attr('id');
            var selectedColumn = $('#' + dropDownID + " option:selected").text();
            if (selectedColumn != "") {
                callApiSetSubLayers(parentNode, selectedColumn);
            } else {
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
    hideSubLayers(3, parentNode);
}

function setFilterTableDropdown() {
    //Modify Combobox dropdownlist
    var allLayers = getAllLayers();
    layerDropdownObjects.forEach(function(element,index) {
        // console.log(index);
        // console.log(element);
        // console.log(element);
        if(index==0){
            element.setData([]);
            element.setData(allLayers);
        }
        // if(index!=1){
        //     element.setData([]);
        //     element.setData(allLayers);
        // }
        
    });
}

function callApiSetSubLayers(parentNode, selectedColumn) {
    getColumnValuesAPI = "/getAllLayerColumnValues/" + parentNode + "/" + selectedColumn;
    // console.log(getColumnValuesAPI);
    var columnValues = [];
    $.ajax(getColumnValuesAPI, {
        // success: setColumnValuesHidden
        success: function(subLayers) {
            if(subLayers.length > 6){
                var confirmed = confirm("There are more than 6 categories in this variable. Proceed?");
                if (confirmed) {
                    setSubLayersHTML(subLayers, parentNode);
                    setFilterTableDropdown();
                } else{
                    var selectedColID = '#'+ parentNode + "_col";
                    $(selectedColID).val('');
                }
            }else{
                setSubLayersHTML(subLayers, parentNode);
                setFilterTableDropdown();
            }             
            
        },
        async: false
    })
}

function getAllLayers() {
    var allLayers = []; //clear initial list;
    $('.node').each(function() {
        parentName = $(this).parent('ul').attr('class').split('_')[1];
        layerName = $(this).attr('id');
        if(parentName){
            allLayers.push(layerName+"_"+parentName);
        }else{
             allLayers.push(layerName);
        }        
    });
    return allLayers;
}

function hideSubLayers(startHidingFromRow, parentNode) {
    // console.log('.layerList_' + parentNode);
    var layerListParentNode = '.layerList_' + parentNode;
    // console.log(layerListParentNode)
    $(layerListParentNode + " li").slice(startHidingFromRow).hide();
    $(layerListParentNode).append("<li>\
                                <a class='showMore_'"+parentNode+" onClick='showMore("+parentNode+")'>Show more</a> ||\
                                <a class='showLess'"+parentNode+" onClick='showLess("+parentNode+")'>Show less</a>\
                            </li>");
}

function showMore(parentNodeHTML) {
    var parentNode = $(parentNodeHTML).attr('id');
    var countLayers = 0;
    var subCategoryLength = $('.layerList_'+parentNode).children('li').length;
    var hiddenSubCategoryLength = 0;
    $('.layerList_'+parentNode).children('li').each(function(){
        if($(this).is(":visible") == false){
            hiddenSubCategoryLength++;
        }
    })
    if(hiddenSubCategoryLength == 0){
        alert('no more subcategory to show');
        return false;
    }
    $('.layerList_'+parentNode).children('li').each(function() {        
        countLayers++;
        // console.log($(this).attr('id'));
        if($(this).is(":visible") == false){
            // alert('no more subcategory to show');
            return false;
        }
    });
    $('.layerList_'+ parentNode +' li').slice(countLayers-1, countLayers+2).show(); //show 3 more
    
}

function showLess(parentNodeHTML) {
    var parentNode = $(parentNodeHTML).attr('id');
    var countLayers = 0;
    var revealedSubCategoryLength = 0;
    $('.layerList_'+parentNode).children('li').each(function() {
        if($(this).is(":visible") == true){
            revealedSubCategoryLength++;
        } 
    });
    // console.log(revealedSubCategoryLength);
    if(revealedSubCategoryLength == 1){
        alert('no more subcategory to hide');
        return false;
    }
    $('.layerList_'+parentNode).children('li').each(function() {        
        countLayers++;
        // console.log($(this).attr('id'));
        if($(this).is(":visible") == false){
            return false;
        }
    });
    // console.log(countLayers);
    if(revealedSubCategoryLength <= 4){
        $('.layerList_'+ parentNode +' li').slice(countLayers-2, countLayers-1 ).hide();
    }else{
        $('.layerList_'+ parentNode +' li').slice(countLayers-4, countLayers-1 ).hide(); //hide 3 from the last row
    }
    
}

function showNoValueInColumn(){
    $('.columns').click(function(){
        var numOfCol = $(this).children('option').length;
        var layerName = $(this).attr('id').split("_")[0];
        if(numOfCol <= 1){
            alert('No suitable variable for subcategorization');
        }
    })
}