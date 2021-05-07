console.log("Loaded!");

const api_url = $.getJSON('/config/config.json').api_url || "http://localhost";
const port  = $.getJSON('/config/config.json').extern_port || 3000;
const api_url_add = $.getJSON('/config/config.json').api_url_add || "";
setIndex();



async function setIndex(area = "LKStade"){
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth()+1;
    const year = today.getFullYear();

    let res = await fetch(`${api_url}:${port}${api_url_add}/indexv2/${area}/${year}/${month}/${day}`);
    let json = await res.json();

    let index = json.index.toFixed(2);

   $("#index").text(index);
   $("#time").text(day + "." + month + "." + year);
}


/*
function beforePrintHandler () {
    for (var id in Chart.instances) {
        Chart.instances[id].resize();
    }
}
*/
getCitys();
async function getCitys(){
    let res = await fetch(`${api_url}:${port}${api_url_add}/allcountys`);
    let json = await res.json();

    var data = [];
    for(const t of json){
        $("#select").append('<option value="'+t.county+'" selected="">'+t.county+'</option>');
       
    }
    $("#select").selectpicker("refresh");

    console.log("Loaded")
    return data;
}

$("#select").on('change',() => {

    setIndex($('.selectpicker').val())
})