var layerDropdownObjects = [];

$(document).ready(function() {
    var table = $('#filterTbl').DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false
    });
    var rowCount = 2;
    addRow(table, rowCount);
    deleteRow(table);
})

function deleteRow(table){
    
    $('#filterTbl tbody').on('click', 'tr', function() {

        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

    $('#deleteRow').click(function() {
        if(table.rows().count() == 1){
            alert("error: unable to delete row");
            return; 
        }
        table.row('.selected').remove().draw(false);
    });
}

function addRow(table, rowCount) {
    $('#addRow').on('click', function() {
        var emptyArr = [];
        table.row.add([
            "<select id='operator_" + rowCount + "' class='form-control' name='operator'>\
                <option>&le;</option>\
                <option>&ge;</option>\
                <option>=</option>\
            </select>", //add col 1
            "<input id='operator-amt_" + rowCount + "' type='number' name='operator-amt' class='operator-amt form-control' placeholder='numeric'>",
            "<div id='layer-selected_" + rowCount + "' class='layer-selected'></div>",
            "<input id='within-range_" + rowCount + "' type='number' name='within-range' class='within-range form-control' placeholder='numeric'>",
            "<p>OR</p>"
        ]).draw(false); //add the new row without redrawing the whole table
        var allLayers = getAllLayers();
        setLayerDropdownlist(rowCount,allLayers); 
        rowCount++;        
    });
}

function setLayerDropdownlist(dropdownID, layers){
    var layerDropdownObject = $('#layer-selected_'+dropdownID).magicSuggest({
      allowFreeEntries: false, //must only type values that are inside the dropdownlist
      data: layers,
      maxSelection: 1
    });

    layerDropdownObjects.push(layerDropdownObject);
    console.log(layerDropdownObjects);
}

function refreshLayerDropdownList(dropdownID, layers){
    var layerDropdownObject = layerDropdownObjects[dropdownID-1]; //dropdownID starts from 1, so must-1
    console.log(layerDropdownObject);
    console.log(layers);
}