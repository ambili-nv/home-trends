
const asynchandler = require('express-async-handler');
const User = require("../../models/userModel");
const {roles} = require("../../utils/constants");
const Products = require("../../models/productModel");
const category = require("../../models/categoryModel");
const validateMongoDbId = require("../../utils/validateMongoDbId");
const Address = require("../../models/addressModel")

exports.loadHome = asynchandler(async (req,res)=>{


    try {
        const queryOption = {isListed:true};
        const Category = req.query;   
        const messages = req.flash();


        if (Category) {
            queryOption.Category = Category;
        }

        const allProducts = await Products.find({}).populate("images").populate("category");
        const products = allProducts;

        const categories = await category.find({isListed:true});
        const totalProductsCount = allProducts.length;
        // console.log(totalProductsCount);
        res.render("./shop/pages/home",{title:"Shop Page",page:"Home", categories,messages,products,totalProductsCount,Category,  user: req.user});
     
    } catch (error) {
        throw new Error(error); 
     }
});


exports.loadAboutus = asynchandler(async(req,res)=>{
    try {
        res.render('./shop/pages/about_us',{user: req.user})
    } catch (error) {
        console.log(error);
    }
})

exports.loadContact = asynchandler(async(req,res)=>{
    try {
        res.render('./shop/pages/contact',{user: req.user})
    } catch (error) {
        console.log(error);
    }
})





exports.loadProfile = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        const user = await User.findById(req.user._id).populate("address");
        res.render("shop/pages/userprofile", { title: "Profile", page: "profile" ,user,messages});
    } catch (error) {
        throw new Error(error);
    }
});



exports.editProfile = asynchandler(async(req,res)=>{
    const id = req.params.id;
    console.log(id);
    validateMongoDbId(id);
    try{
        
        const{name,email} = req.body;
          const user = await User.findByIdAndUpdate(
            id,
            {
              name,
              email,
            },);


             

            req.flash("success","profile updated");
            res.redirect("/userprofile");
        
    }catch(error){
        throw new Error(error);
    }

});

//Address Page
//GET MEthod

exports.addresspage = asynchandler(async (req, res) => {
    try {
        const userid = req.user._id;
        const userAddress = await User.findOne(userid).populate("address");
        const messages = req.flash()
        res.render("shop/pages/address", { title: "Address", page: "address", address:userAddress.address, messages });
    } catch (error) {
        throw new Error(error);
    }
});

exports.addAddresspage= asynchandler(async (req, res) => {
    try {
        res.render("shop/pages/addaddress", { title: "Add Address", page: "add-address" });
    } catch (error) {
        throw new Error(error);
    }
});

//ADD Address 
//POST MEthod

exports.addAddress = asynchandler(async(req,res)=>{
    try {
        
        const userid = req.user._id;
        const contentType = req.get("Content-Type");
        
        const newAddress = await Address.create(req.body);
        await User.findByIdAndUpdate(userid, { $push: { address: newAddress._id } });
        if (contentType === "application/x-www-form-urlencoded"){
            req.flash("success", "Address Added");
            res.redirect("/address");
        }else if (contentType === "application/json") {
            res.json({ status: "ok" });
        }
    } catch (error) {
        throw new Error(error);
    }
});

//Edit Address page
//GET MEthod

exports.editAddresspage = asynchandler(async (req, res) => {
    try {
        const id = req.params.id;
        validateMongoDbId(id);
        const address = await Address.findById(id);
        res.render("shop/pages/editaddress", { title: "Edit Address", page: "Edit-address", address });
    } catch (error) {
        throw new Error(error);
    }
});


//EditAddress
//POST MEthod


exports.editaddress = asynchandler(async (req, res) => {
    try {
        const id = req.params.id;
        validateMongoDbId(id);
        const address = await Address.findByIdAndUpdate(id, req.body);
        req.flash("success", "address updated");
        res.redirect("/address");
    } catch (error) {
        throw new Error(error);
    }
});