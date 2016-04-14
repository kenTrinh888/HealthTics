var layerDropdownObjects = [];

$(document).ready(function() {
    var filterTableSelector = $('#filterTbl');
    var filterTable = filterTableSelector.DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false
    });
    var filterTableRowCount = 2;
    addFilterRow(filterTable, filterTableRowCount, '#addFilterRow');
    deleteFilterRow(filterTable, filterTableSelector, "#deleteFilterRow");
})

function deleteFilterRow(table, tableSelector, deleteType) {

    tableSelector.children('tbody').on('click', 'tr', function(e) {
        // e.preventDefault();
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $(deleteType).on('click', function(e) {
        // if (table.rows().count() == 1) {
        //     alert("error: unable to delete row");
        //     return;
        // }
        table.row('.selected').remove().draw(false);
    });
}

function addFilterRow(table, rowCount, addType) {
    $(addType).on('click', function(e) {
        // e.preventDefault();
        var emptyArr = [];
        table.row.add([
            "<select id='operator_" + rowCount + "' class='form-control' name='operator'>\
                <option>&ge;</option>\
                <option>&le;</option>\
                <option>=</option>\
            </select>", //add col 1
            "<input id='operator-amt_" + rowCount + "' type='number' name='operator_amt' class='operator-amt form-control' placeholder='numeric'>",
            "<div id='layer-selected_" + rowCount + "' class='layer-selected'></div><input type='hidden' name='sublayer_column' class='sublayer-column' id='sublayer-column_"+rowCount+"'>",
            "<input id='within-range_" + rowCount + "' type='number' name='within_range' class='within_range form-control' placeholder='numeric'>",
            "<p>OR</p>"
        ]).draw(false); //add the new row without redrawing the whole table
        var allLayers = getAllLayers();
        setLayerDropdownlist(rowCount, allLayers);

        rowCount++;
    });
}


function setLayerDropdownlist(dropdownID, layers) {
    var layerDropdownObject = $('#layer-selected_' + dropdownID).magicSuggest({
        name: 'layerSelected',
        id: dropdownID,
        allowFreeEntries: false, //must only type values that are inside the dropdownlist
        data: layers,
        maxSelection: 1
    });
    setSublayerColumnHiddenInput(layerDropdownObject,dropdownID);
    layerDropdownObjects.push(layerDropdownObject);
    // layerDropdownObject.setData();
    // console.log(layerDropdownObjects);
}

function setSublayerColumnHiddenInput(layerDropdownObject,dropdownID) {
    $(layerDropdownObject).on('selectionchange', function(e,m){
        console.log('a');
        var layerSelected = this.getValue()[0];
        var sublayer_column = "";
        if(layerSelected){
            var parentLayer = "";
            if(layerSelected.indexOf("_")==-1){ //check if it's already a parent layer
                parentLayer = layerSelected;
                $('#sublayer-column_'+dropdownID).attr('value','N/A');
            } else{ //it's sublayer
                parentLayer = layerSelected.split("_")[1];
                sublayer_column = $('#'+parentLayer+"_col :selected").text();
                $('#sublayer-column_'+dropdownID).attr('value',sublayer_column); //append sublayer_column into hidden input
            }            
        }
    });
};
function refreshLayerDropdownList(dropdownID, layers) {
    var layerDropdownObject = layerDropdownObjects[dropdownID - 1]; //dropdownID starts from 1, so must-1
}


