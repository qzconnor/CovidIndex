const { urlencoded } = require('express');
const express = require('express');
const https = require('https');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const URL = "mongodb://localhost:27017/"; 
const app = express();
const data = require("../backend/datafetch.js")
const { ssl_mode , api_url, api_url_add, intern_port, default_area, fetching, fetching_interval } = require('../frontend/config/config.json');
const { count } = require('console');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('public'));

app.get('/allcountys', (req, res) => {
    MongoClient.connect(URL, { useUnifiedTopology: true },(err, db) => {
        if(err) throw err;
        var dbo = db.db("Covid");
        dbo.collection("citydata").find({},{ projection: { _id: 0, county : 1 } }).toArray((err, result) => {
            if(err) throw err;
            res.send(result);
            db.close();
        })
    })
})

app.get('/indexv2/:area/:year/:month/:day', (req, res) => {
    
    const area = req.params.area;

    const daysource = req.params.day;
    const monthsource = req.params.month-1;
    const yearsource = req.params.year;

    const timestamp = new Date(Date.UTC(yearsource, monthsource, daysource)).getTime();
    const timestampMin = (timestamp - 86400000 * 7);



    MongoClient.connect(URL, { useUnifiedTopology: true },(err, db) => {
        if(err){
            res.send(jsonError(err))
        };
        var dbo = db.db("Covid");
        var members = 0;
        var summ = 0;
        var index = 0;
        
        dbo.collection("citydata").find(
            {
                "county": area
            
            }).toArray((err, result) =>{
                if(err){
                    res.send(jsonError(err))
                };

                for(const CCase of result){
                    members = CCase.ewz;
                }
                        
            })

            dbo.collection(area).find({
                    "Meldedatum":{
                        $gte: timestampMin,
                        $lte: timestamp
                    }
                }).toArray((err, result) =>{
                    if(err){
                        res.send(jsonError(err))
                    };

                    for(const CCase of result){
                        summ += CCase.AnzahlFall;
                    }
                    
                    index = summ / members * 100000;

                    res.send({
                        "index": index
                    })

                    db.close();
                })
            })
     
})

app.get('/allCases/:area', (req, res) => {

    const area = req.params.area;

    MongoClient.connect(URL, { useUnifiedTopology: true },(err, db) => {
        if(err){
            res.send(jsonError(err))
        };
        var dbo = db.db("Covid");
            var summ = 0;
            dbo.collection(area).find().toArray((err, result) =>{
                    if(err){
                        res.send(jsonError(err))
                    };
                    for(const CCase of result){
                        summ += CCase.AnzahlFall;
                    }
                    res.send({
                        "cases": summ
                    })
                    db.close();
            })
    })
     
})

app.get('/datafor/:area/:year/:month/:day', (req, res) => {

    const area = req.params.area;

    const daysource = req.params.day;
    const monthsource = req.params.month-1;
    const yearsource = req.params.year;

    const timestamp = new Date(Date.UTC(yearsource, monthsource, daysource)).getTime();
    
    MongoClient.connect(URL, { useUnifiedTopology: true },(err, db) => {
        if(err){
            res.send(jsonError(err))
        };
        var dbo = db.db("Covid");
        dbo.collection(area).find({ "Meldedatum" : timestamp}).toArray((err, result) => {
            if(err){
                res.send(jsonError(err))
            };
            res.send(result);
            db.close();
        })
    })
})

app.get('/casedata/:area/:year/:month/:day', (req, res) => {

    const area = req.params.area;

    var summ = 0;
    var m = 0;
    var w = 0;
    var mp = 0;
    var wp = 0;
    const daysource = req.params.day;
    const monthsource = req.params.month-1;
    const yearsource = req.params.year;

    const timestamp = new Date(Date.UTC(yearsource, monthsource, daysource)).getTime();
    
    MongoClient.connect(URL, { useUnifiedTopology: true },(err, db) => {
        if(err){
            res.send(jsonError(err))
        };
        var dbo = db.db("Covid");
        dbo.collection(area).find({ "Meldedatum" : timestamp}).toArray((err, result) => {
            if(err){
                res.send(jsonError(err))
            };

            for(const CCase of result){
                var numberCase = CCase.AnzahlFall;
                summ += numberCase;
                if(CCase.Geschlecht == "M"){
                    m += numberCase;
                }else{

                    w += numberCase;
                }
                mp = m / summ * 100;
                wp = w / summ * 100;
            }
            res.send({
                "cases": summ,
                "M": m,
                "W": w,
                "MP": mp,
                "WP": wp
            })

            db.close();
        })
    })
})

function jsonError(err){
    return {
        "code": 500,
        "message": err 
    }
}

var httpsServer = https.createServer(credentials, app);

if(ssl_mode){
    var privateKey  = fs.readFileSync('sslcert/privkey.pem', 'utf8');
    var certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
    var credentials = {key: privateKey, cert: certificate};

    httpsServer.listen(intern_port, "0.0.0.0", () => {
        console.log(`Webserver in prod mode on port ${intern_port}`)
        if(fetching){
            console.log("init data update")
            data.dataImport();
            console.log("updating every 60m");
            setInterval(()=>{
                data.dataImport();
            },fetching_interval)
        }
        
    });
}
if(!ssl_mode){
    app.listen(intern_port, "0.0.0.0", () => {
        console.log(`Webserver in dev mode on port ${intern_port}`)
        if(fetching){
            console.log("init data update")
            data.dataImport();
            console.log("updating every 60m");
                setInterval(()=>{
                    data.dataImport();
                },fetching_interval)
        }
      
    });
}


