const fetch = require('node-fetch');
const MongoClient = require('mongodb').MongoClient;
const URL = "mongodb://localhost:27017/";

module.exports = {
    async dataImport(){

        const dataIDCount = await fetch('https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=1%3D1&returnIdsOnly=true&returnCountOnly=true&outFields=Geschlecht,AnzahlFall,ObjectId,Meldedatum,NeuerFall,Refdatum,Landkreis&outSR=4326&f=json')
        const citydata = await fetch('https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=EWZ,county&returnGeometry=false&outSR=4326&f=json')

        const dataIDCountJson = await dataIDCount.json();

        var dataFull = []
        var caseNumber = dataIDCountJson.count;
        const citydataJson = await citydata.json();

        var citybody = convertCityInfo(citydataJson.features)

        console.log("Starting fetch")
        for (let i = 0; i < caseNumber; i+=4000) {
            const min = i;
            const max = i+4000;

            const dataPart = await fetch(`https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_COVID19/FeatureServer/0/query?where=ObjectId >%3D ${min} AND ObjectId <%3D ${max}&1%3D1&outFields=Geschlecht,AnzahlFall,ObjectId,Meldedatum,NeuerFall,Refdatum,Landkreis&outSR=4326&f=json`);

            const dataPartJson = await dataPart.json();

            dataFull.push(dataPartJson.features);
        }
        console.log("finished fetch")

        console.log("starting conversion")
        var body = convertToDataSet(dataFull);
        console.log("finished conversion")

        console.log("starting grouping")
        var groupBy = function (xs, key) {
            return xs.reduce(function (rv, x) {
                (rv[x[key]] = rv[x[key]] || []).push(x);
                return rv;
            }, {});
        };

        var groubedByArea = groupBy(body, 'Landkreis')
        var groubedByAreaindex = [];

        // build the index
        for (var x in groubedByArea) {
            groubedByAreaindex.push(x);
        }

        groubedByAreaindex.sort(function (a, b) {
            return a == b ? 0 : (a > b ? 1 : -1);
        });

        console.log("finished grouping")

        //db init
        const client = await MongoClient.connect(URL, { useUnifiedTopology: true, useNewUrlParser: true,});
        client.db("Covid").dropDatabase();
        var dbo = client.db("Covid");

        //inserting city info
        dbo.collection("citydata").insertMany(
            citybody,{
                ordered: true
             },
             function(err,res){

                 if(err) throw err;

             }


        );

        console.log(Object.keys(groubedByArea).length);
        console.log("starting inserting")
        for (let i = 0; i < Object.keys(groubedByArea).length; i++) {


            var collectionname = groubedByArea[groubedByAreaindex[i]][0].Landkreis.split(" ").join("");
            collectionname = collectionname.replace(/\./g,'');

            dbo.collection(collectionname).insertMany(
                groubedByArea[groubedByAreaindex[i]],
                {
                    ordered: true
                },
                function(err,res){

                    if(err) throw err;

                }
            )
            dbo.collection(collectionname).createIndex( { Meldedatum: 1});

        }
        console.log("data inserting loop ended");

        //close db connections after async inserting is done
        setTimeout(function(){client.close()}, 100000);
    }

}

function convertCityInfo(json){
    var countydata = [];

        for(const feature of json){
            const ewz = feature.attributes.EWZ;
            const county = feature.attributes.county.split(" ").join("").replace(/\./g,'');

            const set = {
                county,
                ewz
            }

            countydata.push(set);
        }

        return countydata;
}


function convertToDataSet(json){
    var dataArray = [];


    for(const feature of json){

        for(var i = 0; i < feature.length; i++){

            const ObjectId = feature[i].attributes.ObjectId;
            const Landkreis = feature[i].attributes.Landkreis;
            const Meldedatum = feature[i].attributes.Meldedatum;
            const Refdatum = feature[i].attributes.Refdatum;

            const AnzahlFall = feature[i].attributes.AnzahlFall;
            const NeuerFall = feature[i].attributes.NeuerFall;

            const Geschlecht = feature[i].attributes.Geschlecht;

            const dataSet = {
                ObjectId,
                Landkreis,
                Meldedatum,

                Refdatum,

                "RFISO": new Date(Refdatum).toISOString(),
                "MDISO" : new Date(Meldedatum).toISOString(),

                AnzahlFall,
                NeuerFall,
                Geschlecht

            }
            dataArray.push(dataSet);
        }
    }


    return dataArray;
}
