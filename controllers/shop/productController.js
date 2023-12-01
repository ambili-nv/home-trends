const asynchanlder = require("express-async-handler");
const category = require("../../models/categoryModel");
const Products = require("../../models/productModel");
const validateMongoDbId = require('../../utils/validateMongoDbId');


//shop page
//get method

exports.shoppage = asynchanlder(async(req,res)=>{
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
        console.log(totalProductsCount);
        res.render("./shop/pages/shops",{title:"Shop Page",page:"shop", categories,messages,products,totalProductsCount,Category,user: req.user});

    } catch (error) {
        throw new Error(error); 
     }
 });


 //Single paroduct 
 //GET Method

 exports.singleProduct = asynchanlder(async (req, res) => {
    const id = req.params.id;
    console.log(id);
    validateMongoDbId(id);
   try {
    const messages = req.flash();
    const product = await Products.findById(id).populate("images").populate("category");
   
    res.render("shop/pages/product", {title: "Product", page: "Product ",messages,product,user: req.user})
   } catch (error) {
    throw new Error(error)
   }
});