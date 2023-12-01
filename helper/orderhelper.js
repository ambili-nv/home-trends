const asynchandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const OrderItem = require("../models/orderItemModel");
const { status } = require("../utils/status");



//Get Orders from user

exports.getOrders = asynchandler(async (userId) => {
    const orders = await Order.find({ user: userId })
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          populate: {
            path: "images",
          },
        },
      })
      .select("orderId orderedDate shippingAddress city")
      .sort({ _id: -1 });
  
    return orders;
  });


  exports.getSingleOrder = asynchandler(async (orderId) => {
    const order = await OrderItem.findById(orderId).populate({
      path: "product",
      model: "Product",
      populate: {
        path: "images",
        model: "Images",
      },
    });
    const orders = await Order.findOne({ orderItems: orderId });
    return { order, orders };
  });




  exports.cancelOrderById = asynchandler(async (orderId) => {
    const order = await Order.findById(orderId).populate("orderItems");
  
    if (order.orderItems.every((item) => item.status === status.cancelled)) {
      return { message: "order is already cancelled" };
    }
   
    if (order.payment_method === "cash_on_delivery") {
      for (const item of order.orderItems) {
        await OrderItem.findByIdAndUpdate(item._id, {
          status: status.cancelled,
        });
        const cancelledProduct = await Product.findById(item.product);
        cancelledProduct.quantity += item.quantity;
        cancelledProduct.sold -= item.quantity;
        await cancelledProduct.save();
      }
  
      order.status = status.cancelled;
      await order.save();
  
      return "redirectBack";
    }
  });



  //Cancel Order

  exports.cancelSingleOrder = asynchandler(async (orderItemId, userId) => {
    const updatedOrder = await OrderItem.findByIdAndUpdate(orderItemId, {
      status: status.cancelled,
    });
    // if (updatedOrder.isPaid !== "pending") {
    //   const cancelledProduct = await Product.findById(updatedOrder.product);
    //   cancelledProduct.quantity += updatedOrder.quantity;
    //   cancelledProduct.sold -= updatedOrder.quantity;
    //   await cancelledProduct.save();
    // }
  
    
    return "redirectBack";
  });