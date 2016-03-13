$(document).ready(function(){
  var allKPIs = JSON.parse(getAllKPIs());

  console.log(typeof allKPIs);
  // allKPIs.forEach(function(KPI,index){
  //   console.log(KPI);
  // })
  allKPIs.forEach(function(KPI,index){
    if(index != allKPIs.length-1){
      addRow(index);
    }
    $('#kpiName_'+(index+1)).html(KPI.kpiName);
    $('#kpiNumber_'+(index+1)).html(KPI.reqFinal.countSuccessDwellings);
    $('#kpiPercent_'+(index+1)).html(KPI.reqFinal.percentPopulation);
    // console.log(KPI);
    var bulletChartID = '#kpibulletchart_' + (index+1)  +' svg';
    // console.log('bullet: ' + bulletChartID);
    addBulletChart(bulletChartID,KPI);
    
  })
})

function addRow(index){
  var KPIRowHTML = "<tr id='KPIRow_"+(index+2)+"' class='KPIRow'>\
                <td class='col-md-2'><span class='kpiName' id='kpiName_"+(index+2)+"'></span></td>\
                <td class='col-md-6'><span class='kpibulletchart' id='kpibulletchart_"+(index+2)+"'><svg></svg></span></td>\
                <td class='col-md-2'><span class='kpiNumber' id='kpiNumber_"+(index+2)+"'></span></td>\
                <td class='col-md-2'><span class='kpiPercent' id='kpiPercent_"+(index+2)+"'></span></td>\
              </tr>";
  $('#kpiListTbl tbody').append(KPIRowHTML);
}
function getAllKPIs(){
  getAllKPIurl = "/getAllKPIs";
  $.ajaxSetup({ async: false });
  var allKPIs = $.get(getAllKPIurl).responseText;
  $.ajaxSetup({ async: true });
  return allKPIs;
}

function addBulletChart(bulletChartID,KPI){
  nv.addGraph(function() {  
    var chart = nv.models.bulletChart();

    d3.select(bulletChartID)
        .datum(bulletChartData(KPI))
        .transition().duration(1000)  
        .call(chart);

    return chart;
  });
}



function bulletChartData(KPI) {
  var measures = [];
  measures.push(KPI.reqFinal.percentPopulation);
  return {
  	"subtitle":"%",		//sub-label for bullet chart
  	"ranges":[30,50,100],	 //Minimum, mean and maximum values.
  	"measures":measures,		 //Value representing current measurement (the thick blue line in the example)
  	"markers":[75]			 //Place a marker on the chart (the white triangle marker)
  };
}