
setLayersHTML();

function setLayersHTML() {
    getLayerAPI = "/getAllLayerColumnName";
    // $('.tree').treed();  
    $.get(getLayerAPI, function(layers, err) {
        if (layers) {
            var layersTrimmed = []; //fix here
            layers.forEach(function(layer) {
                layerName = layer.name.split('.')[0]; //remove .geojson extension
                layersTrimmed.push(layerName); //fix here
                var listHTML = "<li id='" + layerName + "'>\
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
            setLayerDropdownlist(layersTrimmed); //fix here
        };
        setSubLayersHTML();
    });
    $('.tree').treed();
};

function setSubLayersHTML() {
    console.log($('.columns').attr('id'));
    $('.columns').ready(function() {
        $('.columns').change(function() {
            var parentNode = $(this).parent('li').attr('id'); //e.g. RelaxSG
            $('#' + parentNode).children('ul').remove();
            $('#' + parentNode).append('<ul></ul>');

            var dropDownID = $(this).attr('id');
            var selectedColumn = $('#' + dropDownID + " option:selected").text();
            getColumnValuesAPI = "/getAllLayerColumnValues/" + parentNode + "/" + selectedColumn;
            console.log(getColumnValuesAPI);
            $.get(getColumnValuesAPI, function(columnValues) {
                console.log(columnValues);
                columnValues.forEach(function(columnValue) {
                    var childNodeHTML = "<li>\
                                            " + columnValue + "</span>\
                                        </li>\
                                        ";
                    console.log(childNodeHTML);
                    $('#' + parentNode).children('ul').append(childNodeHTML);
                })
                setLayerDropdownlist(columnValues); //set layers on layer drop down list
            })

        });
    });
};

function setLayerDropdownlist(layers){
    $('.layer-selected').magicSuggest({
      allowFreeEntries: false,
      data: layers
    });
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
