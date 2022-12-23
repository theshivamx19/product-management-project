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

//===================Update cart by user ID=======================//
  const updateCart = async function (req, res) {
    try {
      let data = req.body;
      let userId = req.params.userId;
  
      if (!userId || !isValid.isIdValid(userId))
        return res.status(400).send({ status: false, message: "Invalid userId" });
  
      let user = await cartModel.findOne({ userId: userId });
      if (!user)
        return res.status(400).send({ status: false, message: "User doesn't exist!" });
  
      let { cartId, productId, removeProduct } = data;
  
      if (!productId || !isValid.isIdValid(productId))
        return res.status(400).send({ status: false, message: "Invalid productId" });
  
      let product = await productModel.findOne({ _id: productId });
      if (!product)
        return res.status(400).send({ status: false, message: "Product doesn't exist!" });
  
    
      if (!cartId || !isValid.isIdValid(cartId))
        return res.status(400).send({ status: false, message: "Invalid cartId" });
  
      let cart = await cartModel.findOne({ _id: cartId });
      if (!cart)
        return res.status(400).send({ status: false, message: "Cart doesn't exist!" });
  
      if (removeProduct) {
        if (![1, 0].includes(removeProduct))
          return res.status(400).send({status: false,message: "Invalid value for removeProduct, it can be only 0 or 1!"});
      }
  
      let items = cart.items.filter( (product) => product["productId"].toString() === productId )
  
      if (items.length == 0)
        return res.status(400).send({status: false,message: `No product  exists in cart`});
  
  
      for (let i = 0; i < items.length; i++) {
        if (items[i].productId == productId) {
          let totalProductprice = items[i].quantity * product.price;
          if (removeProduct === 0) {
            const updateProductItem = await cartModel.findOneAndUpdate(
              { _id: cartId },
              {
                $pull: { items: { productId: productId } },
                totalPrice: cart.totalPrice - totalProductprice,
               // totalItems: cart.totalItems - 1,
              },
              { new: true }
            );
            return res.status(200).send({status: true,msg: "sucessfully removed product",data: updateProductItem})
          }
          if (removeProduct === 1) {
            if (items[i].quantity === 1 && removeProduct === 1) {
              const removeCart = await cartModel.findOneAndUpdate(
                { _id: cartId },
                {
                  $pull: { items: { productId: productId } },
                  totalPrice: cart.totalPrice - totalProductprice,
                  //totalItems: cart.totalItems - 1,
                },
                { new: true }
              );
              return res.status(200).send({status: true,msg: "sucessfully removed product or cart is empty", data: removeCart });
            }

            items[i].quantity = items[i].quantity - 1;
            const updateCart = await cartModel.findByIdAndUpdate(
              { _id: cartId },
              { items: items, totalPrice: cart.totalPrice - product.price },
              { new: true }
            );
            return res.status(200).send({ status: true,msg: "sucessfully decreases product",data: updateCart });
          }
        }
      }
     
    } catch (error) {
      return res.status(500).send({ status: false, error: error.message });
    }
  };

//===================Get cart by user ID=======================//
const getCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        //userId valid or not
        if (!isValid.isIdValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res
                .status(404)
                .send({ status: false, message: "No User Found With this Id" });
        }

        //if exist than send the details
        let isCart = await cartModel
            .findOne({ userId: userId })
            .populate("items.productId", { title: 1, price: 1, productImage: 1});

        if (!isCart) {
            return res
                .status(404)
                .send({ status: false, message: "There Is Nothing In ur Cart" });
        } else {
            return res.status(200).send({ status: true, data: isCart });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};
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

module.exports ={createCart,updateCart,getCart,deleteCart}



