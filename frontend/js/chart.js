var ctx = document.getElementById('myChart').getContext('2d');

var api_url;
var port;
var api_url_add;
var default_area;

$.getJSON(config_path, function(data) {

    api_url = data.api_url;
    port  = data.extern_port;
    api_url_add = data.api_url_add;
    area = data.default_area;
    
    showChart(area);
    fetchCaseData(area);
});

var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '# of infections per 100.000',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',         
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)',
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',                
                'rgba(255, 99, 132, 1)',
                
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',                
                'rgba(255, 99, 132, 1)',
                
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',                
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }]
        },
        animation:{
            duration: 1000,
            easing: "easeInOutExpo"
        }
        
    }
});

$("#select").on('change',() => {
    showChart($('.selectpicker').val())
    fetchCaseData($('.selectpicker').val())
})

async function showChart(area){
    const data = await fetchIndex(area);
    addData(myChart, data.dates, data.indexes)
    myChart.update();
}

async function fetchIndex(area){
    const timestamp = new Date();
    var data = {
        dates: [],
        indexes: []
    }
    for(var i = 30; i >= 0; i--){

        var timeMin = new Date(timestamp - 86400000 * i);
        var day = timeMin.getDate();
        var month =  timeMin.getMonth()+1;
        var year = timeMin.getFullYear();
        let res;
        let json;
        var result = false;
        while (!result) {
            res = await fetch(`${api_url}:${port}${api_url_add}/indexv2/${area}/${year}/${month}/${day}`);
            json = await res.json();
            if(json.index){
                result = true;
            }else{
                //console.log("null value")
            }

        }
        

        
        data.dates.push(day + "." + month);
        data.indexes.push(json.index);
        
        
    }
    //console.log(data.indexes);
    return data;

}

async function fetchCaseData(area){
    
    const timestamp = new Date();

    $('#data-table').empty();

    for(var i = 0; i < 30; i++){

        var timeMin = new Date(timestamp - 86400000 * i);
        var day = timeMin.getDate();
        var month =  timeMin.getMonth()+1;
        var year = timeMin.getFullYear();
        let res = await fetch(`${api_url}:${port}${api_url_add}/casedata/${area}/${year}/${month}/${day}`);
        let json = await res.json();
        
        var field = `

        <div class="row data-${i} data text-center">
            <div class="col date box-data">
                <span title="Date">${day + "." + month + "." + year}</span>
            </div>
            <div class="col caseC box-data">
                <span title="Increased Cases">+${json.cases}</span>
            </div>  
            <div class="col PerSex box-data">
            <div class="progress progress-striped">
                <div class="progress-bar" style="width: ${json.MP.toFixed(2)}%; background-color: rgba(54, 162, 235, 1);">
                    <span title="Male to Female">${json.MP.toFixed(2)}% </span>
                </div>
                <div class="progress-bar" style="width: ${json.WP.toFixed(2)}%; background-color: rgba(255, 99, 132, 1);">
                    <span  title="Female to Male">${json.WP.toFixed(2)}% </span>
                </div>
                </div>
                <!--<span>${json.MP.toFixed(2)}%  |  ${json.WP.toFixed(2)}%</span>--> 
            </div>
        </div>`
        $(field).appendTo($('#data-table'));
        
    }
    

}
function addData(chart, labels, data) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    // chart.update();
}