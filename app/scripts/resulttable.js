$(document).ready(function() {
    var resultTableSelector = $('#resultTbl');
    var resultTable = resultTableSelector.DataTable({
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false
    });
    var resultTableRowCount = 2;
    deleteRow(resultTable,resultTableSelector,"#deleteResultRow");
})

function deleteRow(table,tableSelector,deleteType) {

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