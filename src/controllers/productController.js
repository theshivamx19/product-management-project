const isValid = require("../validation/validators")
const productModel=require('../models/productModel')
const aws = require('../aws/awsConfiq')

//===================Create product=======================//
const createProducts = async function (req, res) {
    try {
        let data = req.body;
        let file = req.files;

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, availableSizes, style, installments } = data;

        //body empty or not
        if (!isValid.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Provide the Product's Data" });
        }

        //title validation
        if (!title) {
            return res.status(400).send({ status: false, message: "Provide the Title Name" });
        }

        let checkTitle = await productModel.findOne({ title: title });
        if (checkTitle) {
            return res.status(400).send({ status: false, message: `Product with this ${title} is Already Present` });
        }

        //description validation
        if (!description) {
            return res.status(400).send({ status: false, message: "Please Write Description About Product " });
        }

        //price validation
        if (!price) {
            return res.status(400).send({ status: false, message: "Price is Required" });
        }
        if (price <= 0) {
            return res.status(400).send({ status: false, message: "Price can't be Zero or less than Zero " });
        }
        if (!/^[0-9]*$/.test(price)) {
            return res.status(400).send({ status: false, message: "Price should be in Number" });
        }

        //currencyId validation
        if (!currencyId) {
            return res.status(400).send({ status: false, message: "Provide the CurrencyId " });
        }
        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "CurrencyId should be in INR" });
        }

        //currencyFormat validation
        if (!currencyFormat) {
            return res.status(400).send({ status: false, message: "Please Enter Currency Symbol" });
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "Currency Symbol should be only in '₹'" });
        }

        //isFreeShipping validation
        if (isFreeShipping != null) { 
            if (!(isFreeShipping.toLowerCase() === "true" || isFreeShipping.toLowerCase() === "false")) {
                return res.status(400).send({ status: false, message: "Please Provide only Boolean Value" });
            }
            data["isFreeShipping"] = isFreeShipping.toLowerCase();
        }

        //profile image validation
        if (file && file.length > 0) {
            if (!isValid.isValidFile(file[0].originalname)) {
                return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" });
            }
            //store the profile image in aws and creating profile image url via "aws package" 
            let url = await aws.uploadFile(file[0]);
            data["productImage"] = url;
        } else {
            return res.status(400).send({ status: false, message: "Please Provide ProductImage" });
        }

        //Size validation
        if (!availableSizes) {
            return res.status(400).send({ status: false, message: "Please Enter Size of Product" });
        }
        // let size = ["S", "XS","M","X", "L","XXL", "XL"]
       
        //   if(!size.includes(availableSizes)){
        //     return res.status(400).send({ status: false, message: "Please Enter correct Sizes S, XS,M,X, L,XXL, XL" });
        //   }
        

        //installments validation
        if (installments) {
            if (!/^[0-9]*$/.test(installments)) {
                return res.status(400).send({ status: false, message: "Installments value Should be only number" });
            }
            if (installments < 0) {
                return res.status(400).send({ status: false, message: "installments Shoud be In Valid  Number only" });
            }
        }

        //style validation
       
            if (!style) {
                return res.status(400).send({ status: false, message: "Provide the style " });
            }
        

        //after checking all the validation, than creating the product data
        const createdProduct = await productModel.create(data);
        return res.status(201).send({
            status: true,
            message: "Product is Created Successfully",
            data: createdProduct,
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

//===================get product by ID=======================//
const getproduct = async function (req, res) {
    try {
        let productId = req.params.productId

        
        if (!productId) {
            res.status(400).send({ status: false, message: "Please provide productId!" })
        }
        if (!isValid.isIdValid(productId)) {
            return res.status(400).send({ status: false, msg: "please  provide valid productId" })
        }

        const data = await productModel.findById({ _id: productId })
        return res.status(200).send({ status: true, message: "User profile details", data: data })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports ={createProducts,getproduct}