const userModel = require("../models/userModel")
const isValid = require("../validation/validators")
const aws = require('../aws/awsConfiq')
const bcrypt =require('bcrypt')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const saltRounds = 10



///================================create user api=============================//

const createUser = async function (req, res) {
    try {
        let data = req.body;

        const { fname, lname, email, phone, password, address } = data;

        if (!isValid.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide data in the request body!", })
        }

        if (!fname) {
            return res.status(400).send({ status: false, message: "First Name is required!" });
        }
        if (!isValid.isValidName(fname)) {
            return res.status(400).send({ status: false, message: "invalid First Name " })
        }

        if (!lname) {
            return res.status(400).send({ status: false, message: "Last Name is required!" })
        }
        if (!isValid.isValidName(lname)) {
            return res.status(400).send({ status: false, message: "invalid Last Name " })
        }

        if (!email) {
            return res.status(400).send({ status: false, message: "Email is required!" });
        }
        if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid email id" })

        }
        let userEmail = await userModel.findOne({ email: email });
        if (userEmail)
            return res.status(400).send({ status: false, message: "This email address already exists, please enter a unique email address!" });

        if (!phone) {
            return res.status(400).send({ status: false, message: "Phone number is required!" });
        }
        if (!isValid.validatePhone(phone)) {
            return res.status(400).send({ status: false, message: "pls provide correct phone " })
        }
        let userNumber = await userModel.findOne({ phone: phone });
        if (userNumber)
            return res.status(409).send({ status: false, message: "This phone number already exists, please enter a unique phone number!" });

        if (!password) {
            return res.status(400).send({ status: false, message: "Password is required!" });
        }
        if (!isValid.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: " pls provide password" })
        }
        const salt = await bcrypt.genSalt(10)
        const secPass = await bcrypt.hash(password, salt)
        data.password = secPass


        if(address){
      data.address=JSON.parse(address)
        if (!data.address.shipping.street)
            return res.status(400).send({ status: false, message: "Shipping Street is required!" });


        if (!data.address.shipping.city)
            return res.status(400).send({ status: false, message: "Shipping City is required!" });


        if (!data.address.shipping.pincode) {
            return res.status(400).send({ status: false, message: "Shipping Pincode is required!" });
        }
        if (!isValid.validPin(data.address.shipping.pincode)) {
            return res.status(400).send({ status: false, msg: " invalid  pincode " })
        }

        if (!data.address.billing.street)
            return res.status(400).send({ status: false, message: "Billing Street is required!" });

        if (!data.address.billing.city)
            return res.status(400).send({ status: false, message: "Billing City is required!" });

        if (!data.address.billing.pincode) {
            return res.status(400).send({ status: false, message: "Billing Pincode is required!" });
        }
        if (!isValid.validPin(data.address.billing.pincode)) {
            return res.status(400).send({ status: false, msg: " invalid  pincode " })
        }


        const userDetails = await userModel.create(data);
        return res.status(201).send({ status: true, message: "user successfully created", data: userDetails })
    }

    catch (error) {
        return res.status(500).send({ message: error.message });
    }
}


//================================login user api ======================//


const loginuser = async function (req, res) {
    try {
        let email = req.body.email;
        let password = req.body.password

        if (!isValid.isValidRequestBody(req.body)) {
            return res.status(400).send({ status: false, message: "Please provide credentials in the request body!", })
        }
      
        if (!email) {
            return res.status(400).send({ status: false, message: "Email is required!" });
        }
        if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid email id" })

        }
        if (!(password)) {
            return res.status(400).send({ status: false, msg: "Password is required" })
        }
        if (!isValid.isValidPassword(password)) {
            return res.status(400).send({ status: false, msg: "please provide valid password" })
        }
        let checkemail = await userModel.findOne({ email: email });
        if (!checkemail) {
            return res.status(400).send({ status: false, massage: "Please Enter Valid email And Password" })

        }
        const decrypPassword = checkemail.password
        const pass = await bcrypt.compare(password,decrypPassword)
        if(!pass){
            return res.status(400).send({ status: false, msg: "password incorrect" })
        }

        let payload = {userId:checkemail._id.toString(),iat:Date.now(),expiresIn:"18000s"}
        let token = jwt.sign(
            payload,     
            'Project')
        
        let obj ={userId:payload.userId,token:token}

        return res.status(200).send({ status: true, msg: " User login successfull", data:obj })
    }
    catch (err) {
        return res.status(500).send({ status: false, msg: err.message })
    }
}

 




//====================get user api==============================//


const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        
        if (!userId) {
            res.status(400).send({ status: false, message: "Please provide userId!" })
        }
        if (!isValid.isIdValid(userId)) {
            return res.status(400).send({ status: false, msg: "please  provide valid user ID" })
        }

        const data = await userModel.findById({ _id: userId })
        return res.status(200).send({ status: true, message: "User profile details", data: data })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}

//====================update user api==============================//
const updateUser = async function (req, res) {
    try{
    const userId = req.params.userId
    const data = req.body
    const {fname, lname, email, profileImage, phone, password, address}= data
    if (userId.length == 0) {
        return res.status(400).send({ status: false, msg: "User id is required to update profile" })
    }
    const checkUserId = await userModel.findOne({ _id: userId })
    if (!checkUserId) {
        return res.status(404).send({ status: false, msg: "User not exists with this id" })
    }
    if (Object.keys(data).length == 0) {
        return res.status(400).send({ status: false, msg: "Atleast single data is required to update profile" })
    }
    const user = await userModel.findOneAndUpdate({ _id: userId },
        {
            $set: {
                fname,
                lname,
                email,
                profileImage,
                phone,
                password,
                address
            }
        })
        return res.status(200).send({status:true, message : 'Success', data : user})
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//===================exports module=======================//
module.exports = { createUser, loginuser, getUser, updateUser }
