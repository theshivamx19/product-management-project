const isValid = require('../validation/validators')
const userModel = require('../models/userModel')
const cartModel  = require('../models/cartModel')
const productModel = require('../models/productModel')

//===================Create cart by user ID=======================//
const createCart = async function (req, res) {
    try {
      let UserId = req.params.userId;

      if(!UserId){
        return res.status(400).send({status:false,message:"Please provide userID"})
      }
      if (!isValid.isIdValid(UserId)) {
        return res.status(400).send({ status: false, message: "please provide valid user Id" });
      }
      let user = await userModel.findOne({ _id: UserId });
      if (!user) {
        return res.status(400).send({status: false,message: "User doesn't exists",
        });
      }
  
      let data = req.body;
  
      if (!isValid.isValidRequestBody(data)) {
        return res.status(400).send({ status: false, message: "please provide request body" })}
  
      let { productId, cartId,quantity } = data;
  
      if (!isValid.isIdValid(productId)) {
        return res.status(400).send({ status: false, message: "please provide valid product Id" })
      }
  
      if (cartId || cartId == "") {
        if(!isValid.isIdValid(cartId)){
            return res.status(400).send({ status: false, message: "please provide valid cartId" })
        }
        // return res.status(400).send({ status: false, message: "cart id cannot be empty" })
      }
  
      let product = await productModel.findOne({ _id: productId });
      if (!product) {
        return res.status(400).send({ status: false, message: "productId doesn't exists" });
      }
  
      if (product.isDeleted == true) {
        return res.status(400).send({ status: false, message: " product is alrady  Deleted  " })
      }
  
      if (!cartId) {
        let checking = await cartModel.findOne({ userId: UserId });
        if (checking) {
          return res.status(409).send({
            status: false,
            message:
              " User already have a cart please give cart id in request body",
          });
        }
      }
  
      if (cartId) {
        if (!isValid.isIdValid(cartId)) {
          return res.status(400).send({ status: false, message: "please provide valid Cart Id" });
        }
  
        let cart = await cartModel.findOne({ _id: cartId });
        if (!cart) {
          return res.status(400).send({ status: true, message: "Invalid Cart Id" });
        }
        //let quantity = 1;
        if(!quantity){
             quantity = 1
        }
        let arr = cart.items;
  
        let isExist = false;
        for (let i = 0; i < cart.items.length; i++) {
          if (cart.items[i].productId == productId) {
            isExist = true;
            cart.items[i].quantity += quantity;
          }
        }
        if (!isExist) {
          arr.push({ productId: productId, quantity: quantity });
        }
  
        let price = product.price;
        cart.totalPrice += price * quantity;
        cart.totalItems = arr.length;
  
        let update = await cartModel.findOneAndUpdate({ _id: cartId }, cart, {
          new: true});
  
        return res.status(201).send({status: true,message: "Cart created successfully",data: update});
      }
      if (!cartId) {
        let obj = {};
        obj.userId = UserId;
        obj.items = [{ productId: productId, quantity: 1 }];
        obj.totalPrice = product.price;
        obj.totalItems = obj.items.length;
  
        let dataStored = await cartModel.create(obj);
  
        return res.status(201).send({ status: true, message: "Cart created successfully", data: dataStored});
      }
    } catch (err) {
      return res.status(500).send({ status: false, message: err.message });
    }
  };

  //get cart api
//   const getcard = async function (req, res) {
//     try {
//         let userId = req.params.userId
//         //let card=req.param.card
        

//         if (!(cart)) {
//             return res.status(400).send({ status: false, msg: "card is required" })
//         }
//         if (!isValid.isValidPassword(cart)) {
//             return res.status(400).send({ status: false, msg: "please provide valid card" })
//         }
//         let checkecard = await cartModel.findOne({ card: card });
//         if (!checkecard) {
//             return res.status(400).send({ status: false, massage: "Please Enter Valid card" })

//         }
//         if (!(userId)) {
//             return res.status(400).send({ status: false, msg: "userId is required" })
//         }
//         if (!isValid.isValidPassword(password)) {
//             return res.status(400).send({ status: false, msg: "please provide valid userId" })
//         }
//         let checkeuserId = await userModel.findOne({ email: email });
//         if (!checkeuserId) {
//             return res.status(400).send({ status: false, massage: "Please Enter Valid userId" })

//         }
    
//         const data = await cardModel.findById({ _id: userId ,})
//         return res.status(200).send({ status: true, message: "User profile details", data: data })
//     }
//     catch (err) {
//         res.status(500).send({ status: false, message: err.message })
//     }
// }
//===================Delete cart by ID=======================//
const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        if(!userId){
            return res.status(400).send({ status: false, message: "Please Enter userID" });
        }
        //user valid or not
        if (!isValid.isIdValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" });
        }

        //cart validation
        let isCart = await cartModel.findOne({ userId: userId });
        if (!isCart) {
            return res.status(404).send({ status: false, message: "No cart found with this userId" });
        } else {
            //cart deleting means array of items is empty, totalItems is 0, totalPrice is 0
            isCart.totalItems = 0;
            isCart.totalPrice = 0;
            isCart.items = [];

            let delCart = await cartModel.findOneAndUpdate(
                { userId: userId },
                { $set: isCart },
                { new: true }
            );
            return res.status(204).send({
                status: true,
                message: "Cart Deleted Succesfully",
                data: delCart,
            });  //204 No Content
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports ={createCart,deleteCart}