const { Router } = require("express")
const express=require("express")
const router=express.Router()
const userController=require("../controllers/userController")
const mid=require("../middleware/auth")
const aws=require("../controllers/aws")
//=============user api==================//
router.post("/register",userController.createUser);
router.post("/login",userController.loginuser)
router.get("/user/:userId/profile",mid.Authentication,userController.getUser)
router.post('/write-file-aws',aws.getImage)


 router.post("/register",userController.createUser)
 router.post("/login",userController.userLogin)
 router.get("/user/:userId/profile",userController.getUser)


module.exports= router 