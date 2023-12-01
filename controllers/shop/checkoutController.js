const asynchandler = require("express-async-handler");
const validateMongoDbId = require("../../utils/validateMongoDbId");
const User = require("../../models/userModel");
const checkoutHelper = require("../../helper/checkouthelper");
const Cart = require("../../models/cartModel");
const OrderItems = require("../../models/orderItemModel");
const Order = require("../../models/orderModel");
const Product = require("../../models/productModel");




exports.checkoutpage = asynchandler(async (req, res) => {
    try {
      const userid = req.user._id;
      const user = await User.findById(userid).populate("address");
      const cartItems = await checkoutHelper.getCartItems(userid);
      console.log(cartItems);
      const cartData = await Cart.findOne({ user: userid });

  
      if (cartItems) {
        const { subtotal, total} =
          await checkoutHelper.calculateTotalPrice(cartItems, userid, false, null);
  
        
  
        res.render("shop/pages/checkout", {
          title: "Checkout",
          page: "checkout",
          address: user.address,
          product: cartItems.products,
          total,
          subtotal,
          cartData,
        });
      }
    } catch (error) {
      throw new Error(error);
    }
  });



  exports.getCartData = asynchandler(async (req, res) => {
    try {
      const userId = req.user._id;
      const cartData = await Cart.findOne({ user: userId });
      res.json(cartData);
    } catch (error) {
      throw new Error(error);
    }
  });


  exports.placeOrder = asynchandler(async (req, res) => {
    try {
      console.log("inside place order");
      const userId = req.user._id;
      const { addressId, payment_method} = req.body;
      console.log(addressId);
      console.log(payment_method);
  
  
      const newOrder = await checkoutHelper.placeOrder(
        userId,
        addressId,
        payment_method,
      );

  
      if (payment_method === "cash_on_delivery") {
        res.status(200).json({
          message: "Order placed successfully",
          orderId: newOrder._id,
        });
      }  else {
        res.status(400).json({ message: "Invalid payment method" });
      }

      
    } catch (error) {
      throw new Error(error);
    }
  });



  //Oder Placed
  //GET Method
  exports.orderPlaced = asynchandler(async (req, res) => {
    try {
      const orderId = req.params.id;
      
      const order = await Order.findById(orderId).populate({
        path: "orderItems",
        populate: {
          path: "product",
        },
      });
      
      const cartItems = await checkoutHelper.getCartItems(req.user._id);
  
      if (order.payment_method === "cash_on_delivery") {
        for (const item of order.orderItems) {
          item.isPaid = "cod";
          await item.save();
        }
      } 
  
      if (cartItems) {
        for (const cartItem of cartItems.products) {
          const updateProduct = await Product.findById(cartItem.product._id);
          updateProduct.quantity -= cartItem.quantity;
          updateProduct.sold += cartItem.quantity;
          await updateProduct.save();
          await Cart.findOneAndDelete({ user: req.user._id });
        }
      }


      res.render("shop/pages/orderplaced", {
        title: "order placed",
        page: "order placed",
        order: order,
      });
    } catch (error) {
      throw new Error(error);
    }
  });



