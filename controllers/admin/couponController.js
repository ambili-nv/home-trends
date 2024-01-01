const asynchandler = require("express-async-handler");
const Coupon = require('../../models/couponModel');
const {parse} = require('dotenv');
const validateMongoDbId = require('../../utils/validateMongoDbId');


//Coupon Page
//GET Method
exports.couponPage = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        const coupons = await Coupon.find().sort({_id:1})
        res.render("admin/pages/coupons",{title:"coupons",messages,coupons});
    } catch (error) {
        throw new Error(error);
    }
})

//Add Coupon Page
//GET Method
exports.addCouponPage = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        res.render('admin/pages/addCoupons',{title:"Add Coupon",messages,data:{}})
    } catch (error) {
        throw new Error(error);
    }
});

//Add coupon Page
//POST Method

exports.createCoupon = asynchandler(async(req,res)=>{
    try {
        const existingCoupon = await Coupon.findOne({code:req.body.code});

        if(!existingCoupon){
            const newCoupon = await Coupon.create ({
                code:req.body.code,
                type:req.body.type,
                value:parseInt(req.body.value),
                description:req.body.description,
                expiryDate:req.body.expiryDate,
                minAmount:parseInt(req.body.minAmount),
                maxAmount:parseInt(req.body.maxAmount),
            });
            res.redirect('/admin/coupon')
        }
        req.flash("Warning","Coupon already exist")
        res.render('admin/pages/addCoupons',{title:"Add Coupon",data:req.body});
    } catch (error) {
        throw new Error(error)
    }
})

//Edit coupon page 
//GET Method

exports.editCouponPage = asynchandler(async(req,res)=>{
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);
        const couponTypes = await Coupon.distinct("type");
        const messages = req.flash();
        res.render("admin/pages/editCoupons",{title:"Edit Coupon",coupon,couponTypes,messages}) 
    } catch (error) {
        
    }
})


//Edit Coupon 
//POST Method

exports.updateCoupon = asynchandler(async (req, res) => {
    try {
        const couponId = req.params.id;
        const isExists = await Coupon.findOne({ code: req.body.code, _id: { $ne: couponId } });

        if (!isExists) {
            const updtedCoupon = await Coupon.findByIdAndUpdate(couponId, req.body);
            req.flash("success", "Coupon Updated");
            res.redirect("/admin/coupon");
        } else {
            req.flash("warning", "Coupon Already Exists");
            res.redirect("back");
        }
    } catch (error) {
        throw new Error(error)
    }
});

//Delete Coupon
//DELETE Method
exports.deleteCoupon = asynchandler(async(req,res)=>{
    try {
        const id = req.params.id;
        validateMongoDbId(id);
        const deleteCoupon = await Coupon.findByIdAndDelete(id);
        res.redirect("/admin/coupon");
    } catch (error) {
        throw new Error(error);
    }
})