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
        setSubLayersHiddenDiv(); //set hidden div of column values of sub layers html

        var allLayers = getAllLayers();
        setLayerDropdownlist(1, allLayers); //set the first row of dropdownlist
    });
    $('.tree').treed();
};

function setSubLayersHiddenDiv() {
    $('.columns').ready(function() { //columns element is the column drop down list
        $('.columns').change(function() {
            var parentNode = $(this).parent('li').attr('id'); //the layer selected e.g. RelaxSG
            $('#' + parentNode).children('ul').remove();
            $('#' + parentNode).append('<ul></ul>');

            setSubLayersHTML(parentNode);

            var dropDownID = $(this).attr('id');
            var selectedColumn = $('#' + dropDownID + " option:selected").text();
            callApiSetHiddenDiv(parentNode, selectedColumn); //also set hidden <div> id:#hiddenColumnValues
        });
    });
};

function setSubLayersHTML(parentNode) {
    $('#hiddenColumnValues').bind("DOMSubtreeModified", function() {
        var columnValues = $(this).text().split(",");
        columnValues.forEach(function(columnValue) {
            var childNodeHTML = "<li class='node' id='" + columnValue + "'>\
                                   " + columnValue + "</span>\
                               </li>";
            $('#' + parentNode).children('ul').append(childNodeHTML);
        })
        var allLayers = getAllLayers();
        console.log(allLayers);
        layerDropdownObjects.forEach(function(dropdownObject) {
            dropdownObject.setData(allLayers);
        })
    });

}


function callApiSetHiddenDiv(parentNode, selectedColumn) {
    getColumnValuesAPI = "/getAllLayerColumnValues/" + parentNode + "/" + selectedColumn;
    // console.log(getColumnValuesAPI);
    var columnValues = [];
    $.ajax(getColumnValuesAPI, {
        success: setColumnValuesHidden
    })
}

function setColumnValuesHidden(data) {
    // console.log(data);
    $('#hiddenColumnValues').text(data);
}

function getAllLayers() {
    var allLayers = []; //clear initial list;
    $('.node').each(function() {
        layerName = $(this).attr('id');
        allLayers.push(layerName);
    });
    return allLayers;
}

function clearLayerDropdownList() {
    // $('.layer-selected').
}

// function allowDrop(ev) {
//     ev.preventDefault();
// }

// function drag(ev) {
//     console.log('abc');
//     console.log(ev.target.id);
//     ev.dataTransfer.setData("text", ev.target.innerHTML.trim());
// }

// function drop(ev) {
//     console.log('a');
//     ev.preventDefault();
//     var data = ev.dataTransfer.getData("text");
//     console.log(data);
//     ev.target.value = data;
// }

// $('.draggable').draggable();

// var stop = true;
// $(".draggable").on("drag", function(e) {

//     stop = true;

//     if (e.originalEvent.clientY < 300) {
//         stop = false;
//         scroll(-1)
//     }

//     if (e.originalEvent.clientY > ($(window).height() - 300)) {
//         stop = false;
//         scroll(1)
//     }

// });

// $(".draggable").on("dragend", function(e) {
//     stop = true;
// });

// var scroll = function(step) {
//     var scrollY = $(window).scrollTop();
//     $(window).scrollTop(scrollY + step);
//     if (!stop) {
//         setTimeout(function() {
//             scroll(step)
//         }, 20);
//     }
// }
