const asynchandler = require("express-async-handler");
const Order = require("../../models/orderModel");
const OrderItem = require("../../models/orderItemModel");
const Product = require("../../models/productModel");
const status = require("../../utils/status");


//Orders page 
//GET Method

// exports.ordersListPage = asynchandler(async (req, res) => {
//     const itemsperpage = 5;
//     const currentpage = parseInt(req.query.page) || 1;
//     const startindex = (currentpage - 1) * itemsperpage;
//     const endindex = startindex + itemsperpage;
//     const totalpages = Math.ceil(products.length / 5);
//     const currentproduct = products.slice(startindex,endindex);

//     try {
//         const orders = await Order.find().populate({
//             path:"orderItems",
//             populate:{
//                 path:"product",
//                 populate:{
//                     path:"images",
//                 }
//             }
//         })

//         .sort({orderedDate: -1});

//         res.render("admin/pages/orders", { title: "Orders",orders });
//     } catch (error) {
//         throw new Error(error);
//     }
// });


exports.ordersListPage = asynchandler(async (req, res) => {
    const itemsPerPage = 25;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;

    try {
        const totalOrdersCount = await Order.countDocuments();
        const totalpages = Math.ceil(totalOrdersCount / itemsPerPage);

        const orders = await Order.find()
            .populate({
                path: "orderItems",
                populate: {
                    path: "product",
                    populate: {
                        path: "images",
                    },
                },
                select: 'quantity product price status isPaid shippedDate deliveredDate payment_method', 
            })
            .sort({ orderedDate: -1 })
            .skip(startIndex)
            .limit(itemsPerPage);

        res.render("admin/pages/orders", {
            title: "Orders",
            orders,
            currentpage,
            totalpages, // Pass totalpages to the view
        });
    } catch (error) {
        throw new Error(error);
    }
});




//Edit OrderPage
//GET Method
exports.editOrder = asynchandler(async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({orderId:orderId}).populate({
            path:"orderItems",
            modal:"OrderItems",
            populate:{
                path:"product",
                modal:"Product",
                populate:{
                    path:"images",
                    modal:"Images",
                }
            }
        }).populate({
            path:"user",
            modal:"User",
        });
        res.render("admin/pages/editOrder", { title: "Edit Order" , order });
    } catch (error) {
        throw new Error(error);
    }
});




exports.updateOrderStatus = asynchandler(async(req,res)=>{
    try {
        const orderId = req.params.id;

        const order = await OrderItem.findByIdAndUpdate(orderId,{
            status:req.body.status,
        });

        if(req.body.status === status.status.shipped){
            order.shippedDate = Date.now();
        }else if(req.body.status === status.status.delivered){
            order.deliveredDate = Date.now();
        }
        await order.save();

        if(req.body.status === status.status.cancelled){
            if(order.isPaid !== "pending"){
                const product = await Product.findById(order.product);
                product.sold -= order.quantity;
                product.quantity += order.quantity;
                await product.save();
            }
           
            
        } else if(order.status === status.status.returnPending){ 

            order.status = status.status.returned;
            await order.save()
            const product = await Product.findById(order.product);
            product.sold -= order.quantity;
            product.quantity += order.quantity;
            await product .save();

            
        }
        res.redirect("back");   
    } catch (error) {
        throw new Error(error)
    }
})