const asynchanlder = require("express-async-handler");
const Category = require("../../models/categoryModel");
const Products = require("../../models/productModel");
const validateMongoDbId = require('../../utils/validateMongoDbId');


//shop page
//get method

exports.shoppage = asynchanlder(async(req,res)=>{
    try {
        const queryOption = {isListed:true};
        const { page, perPage ,search,sortBy ,category} = req.query;
        const messages = req.flash();

        if (search) {
            queryOption.$or = [
                { title: { $regex: new RegExp(search, "i") } }
            ];
        }

        if (category) {
            queryOption.category = category;
        }


        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(perPage) || 8;
        const allProducts = await Products.find(queryOption).populate("images").populate("category").exec();
        const skip = (currentPage - 1) * itemsPerPage;
        const products = allProducts.slice(skip, skip + itemsPerPage);

        const sortOptions = {};
        if (sortBy === "az") {
            sortOptions.title = 1;
        } else if (sortBy === "za") {
            sortOptions.title = -1;
        } else if (sortBy === "price-asc") {
            sortOptions.salePrice = 1;
        } else if (sortBy === "price-desc") {
            sortOptions.salePrice = -1;
        }

        products.sort((a, b) => {
            if (sortOptions.title) {
                return a.title.localeCompare(b.title) * sortOptions.title;
            } else if (sortOptions.salePrice) {
                return (a.salePrice - b.salePrice) * sortOptions.salePrice;
            }
            return 0;
        });

        const categories = await Category.find({isListed:true});
        const totalProductsCount = allProducts.length;
       
        res.render("shop/pages/shops",{title:"Shop Page",page:"shop", categories,messages,products, currentPage, totalProductsCount, itemsPerPage,sortBy,search,category});
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