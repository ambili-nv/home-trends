const asynchandler = require("express-async-handler");
const validateMongoDbId = require("../../utils/validateMongoDbId");
const User = require("../../models/userModel");
const checkoutHelper = require("../../helper/checkouthelper");
const Cart = require("../../models/cartModel");
const OrderItems = require("../../models/orderItemModel");
const Order = require("../../models/orderModel");
const Product = require("../../models/productModel");
const Razorpay = require("razorpay")
const Wallet = require('../../models/walletModel');
const WalletTransaction = require('../../models/walletTransactionModel');
const Coupon = require('../../models/couponModel')
const { check } = require("express-validator");


exports.checkoutpage = asynchandler(async (req, res) => {
    try {
      
      const userid = req.user._id;
      
      const wallet = await Wallet.findOne({user:userid})
      
      const user = await User.findById(userid).populate("address");
      const cartItems = await checkoutHelper.getCartItems(userid);
      // let items = cartItems.products;
      // for (const item of cartItems.products) {
      //   if (item.product.quantity === 0) {
      //     res.render('')
      //   }
      // }

      const cartData = await Cart.findOne({ user: userid });

      const availablecoupon = await Coupon.find({
        expiryDate: { $gt: Date.now() },
      })
        .select({ code: 1, _id: 0 })
  
      let couponmessages = {};
      const coupons = availablecoupon.map((coupon) => coupon.code).join(" | ");
      couponmessages = { status: "text-info", message: "Try " + coupons };
  
      if (cartItems) {
        const { subtotal, total, discount} =
          await checkoutHelper.calculateTotalPrice(cartItems, userid, false, null);
  
        
  
        res.render("shop/pages/checkout", {
          title: "Checkout",
          page: "checkout",
          address: user.address,
          product: cartItems.products,
          total,
          subtotal,
          cartData,
          couponmessages,
          discount,
          wallet,
        });
      }
    } catch (error) {
      throw new Error(error);
    }
  });


//Place Order
//POST Method



  exports.placeOrder = asynchandler(async (req, res) => {
    try {

      const userId = req.user._id;
      const { addressId, payment_method, code, isWallet} = req.body;

      

      const coupon = await Coupon.find({
        code: code,
        expiryDate: { $gt: Date.now() },
      });
      console.log(coupon,"coupon");
  const cartItems = await checkoutHelper.getCartItems(userId);
  let items = cartItems.products;
for (const item of cartItems.products) {
  if (item.product.quantity === 0) {
    return res.status(201).json({ message: "out of stock" });
  }
}


      const newOrder = await checkoutHelper.placeOrder(
        userId,
        addressId,
        payment_method,
        code,
        isWallet,
        coupon
      );

  
      if (payment_method === "cash_on_delivery") {
        res.status(200).json({
          message: "Order placed successfully",
          orderId: newOrder._id,
          code:code
        });
      } else if (payment_method === "online_payment") {
        const user = await User.findById(req.user._id);
        const wallet = await Wallet.find({ user: userId });
        
        let totalAmount = 0;
        

        if (isWallet) {
          totalAmount = newOrder.totalPrice;
          totalAmount = totalAmount - wallet.balance;
          newOrder.paidAmount = totalAmount;
          newOrder.wallet = wallet.balance;
          await newOrder.save();
  
          const walletTransaction = await WalletTransaction.create({
            wallet: wallet._id,
            amount: wallet.balance,
            type: "debit",
          });
        
        } else {
          totalAmount = newOrder.totalPrice;
          newOrder.paidAmount = totalAmount;
          await newOrder.save();
        }

        var instance = new Razorpay({
          key_id: process.env.RAZORPAY_ID_KEY,
          key_secret: process.env.RAZORPAY_SECRET_KEY,
        });
  
        const rzp_order = instance.orders.create(
          {
            amount: newOrder.totalPrice * 100,
            currency: "INR",
            receipt: newOrder.orderId,
          },
  
          (err, order) => {
            if (err) {
              res.status(500).json(err);
            } else {
              res.status(200).json({
                message: "Order placed successfully",
                rzp_order,
                order,
                user,
                code:code,
                orderId: newOrder._id,
                
              });
            }
          }
        );
       
      
       }  else if (payment_method === "wallet_payment") {
        const wallet = await Wallet.findOne({ user: userId });
        wallet.balance -= newOrder.wallet;
        await wallet.save();
        newOrder.wallet = newOrder.totalPrice;
        await newOrder.save();
  
        const wallettransaction = await WalletTransaction.create({
          wallet: wallet._id,
          amount: newOrder.totalPrice,
          type: "debit",
        });
  
        res.status(200).json({
          message: "Order placed successfully",
          orderId: newOrder._id,
      });
      }
        else {
        res.status(400).json({ message: "Invalid payment method" });
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

  //Oder Placed
  //GET Method
  exports.orderPlaced = asynchandler(async (req, res) => {
    try {
      
      const orderId = req.params.id;
      const userId = req.user._id;
      
      
      const order = await Order.findById(orderId).populate({
        path: "orderItems",
        populate: {
          path: "product",
        },
      });
      
      
      const code = req.query.code
      const coupon = await Coupon.findOne({code:order?.coupon?.code}) || null;

      const cartItems = await checkoutHelper.getCartItems(req.user._id);
  
      if (order.payment_method === "cash_on_delivery") {
        for (const item of order.orderItems) {
          item.isPaid = "cod";
          await item.save();
        }
        if (coupon) {
          coupon.usedBy.push(userId);
          await coupon.save();
        }
      } else if (order.payment_method === "online_payment") {
        for (const item of order.orderItems) {
          item.isPaid = "paid";
          await item.save();
        }

        if (coupon) {
          
          coupon.usedBy.push(userId);
          await coupon.save();
        }

        if (coupon) {
          coupon.usedBy.push(userId);
          await coupon.save();
        }
        const wallet = await Wallet.findOne({ user: userId });
        wallet.balance -= order.wallet;
        await wallet.save();
      } else if (order.payment_method === "wallet_payment") {
        for (const item of order.orderItems) {
          item.isPaid = "paid";
          await item.save();
        }
        
        if (coupon) {
          coupon.usedBy.push(userId);
          await coupon.save();
        }
        const wallet = await Wallet.findOne({ user: userId });
        wallet.balance -= order.totalPrice;
        await wallet.save();
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




  exports.updateCheckoutPage = asynchandler(async (req, res) => {
    try {
      const userid = req.user._id;
      const coupon = await Coupon.findOne({
        code: req.body.code,
        expiryDate: { $gt: Date.now() },
      });
      const user = await User.findById(userid).populate("address");
      const cartItems = await checkoutHelper.getCartItems(userid);
  
      if (coupon) {
        const {
          subtotal,
          total,
          discount,
          usedFromWallet,
          walletBalance,
        } = await checkoutHelper.calculateTotalPrice(
          cartItems,
          userid,
          req.body.payWithWallet,
          coupon
        );
        res.json({
          total,
          subtotal,
          usedFromWallet,
          walletBalance,
          discount,
        });
      } else {
        const { subtotal, total, usedFromWallet, walletBalance, discount } =
          await checkoutHelper.calculateTotalPrice(
            cartItems,
            userid,
            req.body.payWithWallet,
            coupon
          );
        res.json({ total, subtotal, usedFromWallet, walletBalance, discount });
      }
    } catch (error) {
      throw new Error(error);
    }
  });

  






//Razorpay 
//post Method

exports.verifyPayment = asynchandler(async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
      userId,
    } = req.body;
    const result = await checkoutHelper.verifyPayment(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId
    );
    res.json(result);
  } catch (error) {
    throw new Error(error);
  }
});


exports.updateCoupon = asynchandler(async (req, res) => {
  try {
    const userid = req.user._id;
    const coupon = await Coupon.findOne({
      code: req.body.code,
      expiryDate: { $gt: Date.now() },
    });
    // const coupon = null
    

    const cartItems = await checkoutHelper.getCartItems(userid);
    const availableCoupons = await Coupon.find({
      expiryDate: { $gt: Date.now() },
      usedBy: { $nin: [userid] },
    })
    .select({ code: 1, _id: 0 })
    

  
    const { subtotal, total, discount } =
      await checkoutHelper.calculateTotalPrice(cartItems, userid, coupon, false);

    if (!coupon) {
      const coupons = availableCoupons.map((coupon) => coupon.code).join(" | ");
      // const coupons = await Coupon.find({
      //   expiryDate: { $gt: Date.now() },
      //   usedBy: { $nin: [userid] },
      // })

      res.status(202).json({
        status: "info",
        message: "Tr" + coupons,
        subtotal,
        total,
        discount,
      });
    } else if (coupon.usedBy.includes(userid)) {
      res.status(202).json({
        status: "danger",
        messages: "The coupon is already used",
      });
    } else if (subtotal < coupon.minAmount) {
      res.status(200).json({
        status: "danger",
        message: `You need to spend at least ${coupon.minAmount} to get this offer.`,
      });
    } else {
      res.status(200).json({
        status: "success",
        messages: `${coupon.code} applied`,
        coupon: coupon,
        subtotal,
        total,
        discount,
      });
    }
  } catch (error) {
    throw new Error(error);
  }
});