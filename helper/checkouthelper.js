const asynchandler = require("express-async-handler");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const OrderItems = require("../models/orderItemModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Address = require("../models/addressModel");
const { generateUniqueOrderID } = require("../utils/generateUniqueid");



//Get user cart items
exports.getCartItems = asynchandler(async (userId) => {
    return await Cart.findOne({ user:userId}).populate("products.product");
  });

  //Calculate the total price of cart items
  
  exports.calculateTotalPrice = asynchandler(
    async (cartItems, userid) => {
      let subtotal = 0;
      let total = 0
      for (const product of cartItems.products) {
        const productTotal =
          parseFloat(product.product.salePrice) * product.quantity;
        subtotal += productTotal;
        total = subtotal;
      }
        return {
          subtotal,
          total
        };
      }
    
  );


//Place order

  exports.placeOrder = asynchandler(
    async (userId, addressId, payment_method) => {
      const cartItems = await exports.getCartItems(userId);
     
  
      if (!cartItems) {
        throw new Error("cart not found");
      }
      const orders = [];
      let total = 0;
  
      for (const cartItem of cartItems.products) {
        const productTotal =
          parseFloat(cartItem.product.salePrice) * cartItem.quantity;
  
        total = total + productTotal;
  
        const item = await OrderItems.create({
          quantity: cartItem.quantity,
          price: cartItem.product.salePrice,
          product: cartItem.product._id,
        });
        orders.push(item);
      }

  
      const address = await Address.findById(addressId);
  
      const existingOrderIds = await Order.find().select("orderId");
      //Create the order
      const newOrder = await Order.create({
        orderId: "OD" + generateUniqueOrderID(existingOrderIds),
        user: userId,
        orderItems: orders,
        shippingAddress: address.name,
        city: address.city,
        street: address.street,
        state: address.state,
        zip: address.pincode,
        phone: address.mobile,
        totalPrice: total,
        payment_method: payment_method,
      });
      
      return newOrder;
    }
  );