const userModel = require("../models/userModel")
const isValid = require("../validation/validators")
const aws = require('../aws/awsConfiq')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const saltRounds = 10



///================================create user api=============================//

const createUser = async function (req, res) {
    try {
        let data = req.body
        let file = req.files
        let { fname, lname, phone, email, password, address } = data

        // if body is empty---------------------------------------------------------
        if (!isValid.isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Provide User's Data" })
        }


        // Validating Names---------------------------------------------------------
        if (!fname) {
            return res.status(400).send({ status: false, message: "Provide the First Name Feild" });
        }

        if (!isValid.isValidName(fname)) {
            return res.status(400).send({ status: false, message: "Enter valid Fname" });
        }

        if (!lname) {
            return res.status(400).send({ status: false, message: "Provide the Last Name Feild" });
        }

        if (!isValid.isValidName(lname)) {
            return res.status(400).send({ status: false, message: "Enter valid Lname" });
        }


        //phone validation---------------------------------------------------------
        if (!phone) {
            return res.status(400).send({ status: false, message: "Phone Number Feild is Required" });
        }

        if (!isValid.validatePhone(phone)) {
            return res.status(400).send({ status: false, message: "Phone Number should be a valid Indian Phone Number" });
        }

        let PhoneCheck = await userModel.findOne({ phone: phone});
        if (PhoneCheck) {
            return res.status(400).send({ status: false, message: `This No ${phone} is Already Registered` });
        }


        //email validation---------------------------------------------------------
        if (!email) {
            return res.status(400).send({ status: false, message: "Provide the EmailId Feild" });
        }

        if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Provide the Valid EmailId " });
        }

        let checkmail = await userModel.findOne({ email: email });
        if (checkmail) {
            return res.status(400).send({ status: false, message: `${email} is Already Registered` });
        }


        //password validation---------------------------------------------------------
        if (!password) {
            return res.status(400).send({ status: false, message: "Provide the Password " });
        }

        if (!isValid.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password Length must be in btwn 8-15 chars only" });
        }


        //decrypted password create using "bcrypt package"---------------------------------------------------------
        const saltRounds = 10;
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        data["password"] = encryptedPassword;      // setting attribute


        //address validation---------------------------------------------------------
        if (address) {
            let objAddress = JSON.parse(address);     //converting text into a JavaScript object

            //shipping address validation part
            if (objAddress.shipping) {
                if (!objAddress.shipping.street) {
                    return res.status(400).send({ status: false, message: "Please provide street name in shipping address" });
                }
                if (!objAddress.shipping.city)
                    return res.status(400).send({ status: false, message: "Please provide city name in shipping address" });
                   
                    if (!objAddress.shipping.pincode)
                    return res.status(400).send({ status: false, message: "Please provide pincode in shipping address" });

                if (!isValid.validPin(objAddress.shipping.pincode))
                    return res.status(400).send({ status: false, message: "Please provide correct pincode in shipping address" });
            } else {
                res.status(400).send({ status: false, message: "Please Provide Shipping Address In Address Feild" });
            }


            //billing address validation part
            if (objAddress.billing) {
                if (!objAddress.billing.street)
                    return res.status(400).send({ status: false, message: "Please provide street name in billing address" });

                if (!objAddress.billing.city)
                    return res.status(400).send({ status: false, message: "Please provide city name in billing address" });

                
                    if (!objAddress.billing.pincode)
                    return res.status(400).send({ status: false, message: "Please provide pincode in billing address" });

                if (!isValid.validPin(objAddress.billing.pincode))
                    return res.status(400).send({ status: false, message: "Please provide correct pincode in billing address" });
            } else {
                return res.status(400).send({ status: false, message: "Please Provide Billing Address In Address Feild" });
            }

            //after checking both address validation, Than set the address data
            data["address"] = objAddress;

        } else {
            return res.status(400).send({ status: true, message: "Please Provide The Address" });
        }


        //Profile Image validation
        if (file.length == 0) {
            return res.status(400).send({ status: false, message: "Please Provide The Profile Image" })
        }

        if (file && file.length > 0) {
            if (!isValid.isValidFile(file[0].originalname)) {
                return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG", });
            }

            //store the profile image in aws and creating profile image url via "aws package" 
            let newurl = await aws.uploadFile(file[0]);
            data["profileImage"] = newurl;

        }

        //after checking all the validation,than creating the user data
        const created = await userModel.create(data);
        return res.status(201).send({ status: true, message: "User Created Succefully", data: created });
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
        const pass = await bcrypt.compare(password, decrypPassword)
        if (!pass) {
            return res.status(400).send({ status: false, msg: "password incorrect" })
        }

        let payload = { userId: checkemail._id.toString(), iat: Date.now(), expiresIn: "18000s" }
        let token = jwt.sign(
            payload,
            'Project')

        let obj = { userId: payload.userId, token: token }

        return res.status(200).send({ status: true, msg: " User login successfull", data: obj })
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
    try {

        const data = req.body
        const userId = req.params.userId
        const files = req.files
        const update = {}
    
        const { fname, lname, email, phone, password } = data
    
        if (!isValid.isValidRequestBody(data) && !files) {
          return res.status(400).send({status: false,message: "Please provide data in body"})
        }
    
        if (fname || fname == '') {
          if (!fname || !isValid.isValidName(fname)) {
            return res.status(400).send({ status: false, message: "fname is invalid" })
          }
          update["fname"] = fname 
        }
    
        if (lname || lname == '') {
          if (!lname || !isValid.isValidName(lname)) {
            return res.status(400).send({ status: false, message: "lname is invalid" })
          }
          update["lname"] = lname; 
        }
    
        if (email || email == '') {
          if (!isValid.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Email is invalid" })
          }
    
          let userEmail = await userModel.findOne({ email: email })
          if (userEmail) {
            return res.status(409).send({status: false,message:"This email is already registered"})
          }
          update["email"] = email;
        }
    
        if (phone || phone == '') {
          if (!isValid.validatePhone(phone)) {return res.status(400).send({ status: false, message: "Phone is invalid" })
          }
    
          let userNumber = await userModel.findOne({ phone: phone })
          if (userNumber){
            return res.status(409).send({status: false,message:"This phone number already registered"})
           }
          update["phone"] = phone
        }
    
        if (password || password == '') {
          if (!isValid.isValidPassword(password)) {
            return res.status(400).send({status: false,message:"Password should be of 8 to 15 characters and it should contain one Uppercase, one lower case, and Number, Ex - Abhishek@12345,Qwe#121"})
          }
    
          const salt = await bcrypt.genSalt(10)
          data.password = await bcrypt.hash(data.password, salt)
    
          let encryptPassword = data.password
          update["password"] = encryptPassword
        }
    
        let address = data.address
    
        if (address || address == '') {
    
          address=JSON.parse(address)
    
          let { shipping, billing } = address
    
          if (shipping || shipping == '') {
            let { street, city, pincode } = shipping
    
            if (street || street =='') {
              if (!address.shipping.street) {
                return res.status(400).send({ status: false, message: "Invalid shipping street" })
              }
              update["address.shipping.street"] = street
            }
    
            if (city || city == '') {
              if (!address.shipping.city) {
                return res.status(400).send({ status: false, message: "Invalid shipping city" })
              }
              update["address.shipping.city"] = city
            }
    
            if (pincode || pincode == '') {
              if (!isValid.validPin(address.shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Invalid shipping pincode" })
              }
              update["address.shipping.pincode"] = pincode
            }
          }
    
          if (billing || billing == '') {
            let { street, city, pincode } = billing;
    
            if (street || street == '') {
              if (!address.billing.street) {
                return res.status(400).send({ status: false, message: "Invalid billing street" })
              }
              update["address.billing.street"] = street
            }
    
            if (city || city == '') {
              if (!address.billing.city) {
                return res.status(400).send({ status: false, message: "Invalid billing city" })
              }
              update["address.billing.city"] = city
            }
    
            if (pincode || pincode == '') {
              if (!isValid.validPin(address.billing.pincode)) {
                return res.status(400).send({ status: false, message: "Invalid billing pincode" })
              }
              update["address.billing.pincode"] = pincode
            }
          }
    
          //console.log(address)
        }
        
    
        if (files && files.length > 0) {
    
          if (!isValid.isValidFile(files[0].originalname)){
            return res.status(400).send({ status: false, message: `Enter format should be in jpeg/jpg/png only` })
          }
    
          let uploadedFileURL = await aws.uploadFile(files[0])
          //console.log(uploadedFileURL)
    
          update["profileImage"] = uploadedFileURL
        }
    
        else if (Object.keys(data).includes("profileImage")) {
          return res.status(400).send({ status: false, message: "please put the profileimage" });
        }
    
        const updateUser = await userModel.findOneAndUpdate(
          { _id: userId },
          {$set:update},
          { new: true }
        )
    
        return res.status(200).send({status: true,message: "user profile successfully updated",data: updateUser})
      } 
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

//===================exports module=======================//
module.exports = { createUser, loginuser, getUser, updateUser }
