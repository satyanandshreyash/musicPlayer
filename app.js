const express = require("express");
const bodyParser =  require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function(req, res){
    res.send("Homepage");
});

app.listen(3000, function(req,res){
    console.log("ok");
})