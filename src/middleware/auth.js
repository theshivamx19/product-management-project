const jwt =require("jsonwebtoken")

const Authentication=function (req,res,next){
    try {
    let token=req.headers["x-api-key"]
    if(!token) {return res.status(400).send({status:false,message:"token must be present"})}
 let decode =jwt.verify(token,"Project")
 if(!decode) { return res.status(401).send({status:false,message:"user not authenticated"})}
 next()
    }
    catch (error) {
        res.status(500).send({status: false, msg: error.message })
    }
 }
 module.exports={Authentication}