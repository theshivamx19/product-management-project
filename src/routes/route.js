const { Router } = require("express")
const express=require("express")
const router=express.Router()
const userController=require("../controllers/userController")
const productController=require('../controllers/productController')
const mid=require("../middleware/auth")

//=============user api==================//
router.post("/register",userController.createUser);
router.post("/login",userController.loginuser)
router.get("/user/:userId/profile",mid.Authentication,userController.getUser)

//=============product api==================//

router.post("/products",productController.createProducts);
router.get("/products",productController.getProductByFilter)
router.get("/products/:productId",productController.getproduct)
router.delete("/products/:productId",productController.deleteProductById)

module.exports= router 