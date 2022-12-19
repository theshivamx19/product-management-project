const userModel = require("../models/userModel")

const getUser = async function(req,res){
    try{
        let userId = req.params.userId

        //user id validation
        if(!userId){
            res.status(400).send({status:false,message:"Please provide userId!"})
        }
        if(!isvalidObjectId(userId)){
            res.status(400).send({status:false,message:"Invalid userId!"})
        }

        const data = await userModel.find({_id:userId})
        return res.status(200).send({status:true,message:"Success",data:data})
    }
    catch(err){
        res.status(500).send({status:false,message:err.message})
    }
}

