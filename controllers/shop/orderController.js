const asynchandler = require("express-async-handler");
const orderhelper = require("../../helper/orderhelper");
const status = require("../../utils/status");


//Oder Page
//GET MEthod 

exports.orderpage = asynchandler(async(req,res)=>{
    try {
        const userId = req.user._id;

        const orders = await orderhelper.getOrders(userId);
        res.render("shop/pages/order", { title: "Orders", page: "orders" ,orders:orders});
    } catch (error) {
        throw new Error(error);
    }
});


//Single Order
//GET Method

exports.singleOrder = asynchandler(async(req,res)=>{
    try{
        const orderId = req.params.id;

        const{order,orders} =await orderhelper.getSingleOrder(orderId);
        
        res.render("shop/pages/singleOrder",{
            title:order.product.title,
            page:order.product.title,
            order,
            orders,
        });
    }catch(error){
        throw new Error(error)
    }
});


exports.cancelOrder = asynchandler(async(req,res)=>{
    try {
        const orderId = req.params.id;
        
        const result = await orderhelper.cancelOrderById(orderId);

        if(result === "redirectBack"){
            res.redirect("back");
        }else{
            res.json(result);
        }
    } catch (error) {
        throw new Error (error);
    }
});


exports.cancelSingleOrder = asynchandler(async(req,res)=>{
    try {
        const orderItemId = req.params.id;

        const result = await orderhelper.cancelSingleOrder(orderItemId,req.user._id);


        if(result === "redirectBack"){
            res.redirect("back");
        }else{
            res.json(result);
        }
    } catch (error) {
        throw new Error(error);
    }
});
