const express = require("express");
const mongoose = require("mongoose");
const route = require("./routes/route");
const app = express()
const multer= require("multer");

app.use(express.json());  
app.use( multer().any()) 


mongoose.connect("mongodb+srv://kunal0709:Singhkunal7@cluster0.u5yk4f2.mongodb.net/group7Database",{
    useNewUrlParser:true  
}) 

.then(()=> console.log("MongoDB is connected"))  
.catch(err => console.log(err))


app.use("/",route) 

app.use( (req ,res) => {
    res.status(400).send({status : false , message :`Page Not Found , Given URL ${req.url} is incorrect for this application.`})
})

app.listen(process.env.PORT || 3000, function(){
    console.log("express app runing on port "+(process.env.PORT || 3000) )
})

