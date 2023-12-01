const asynchandler = require('express-async-handler');
const User = require("../../models/userModel");
const Category = require("../../models/categoryModel");
const Products = require("../../models/productModel");
const Image = require("../../models/imageModel");
const order = require('../../models/orderModel');
const validateMongoDbId = require('../../utils/validateMongoDbId');
const path = require("path");
const sharp = require("sharp");
const {roles} = require("../../utils/constants");
// const { log } = require('console');





exports.homepage = asynchandler(async (req, res) => {
    const admin = req.user

    const orders = await order.find().populate({
        path:"orderItems",
        populate:{
            path:"product",
            populate:{
                path:"images",
            }
        }
    })
    try {
        if (admin) {
            res.redirect("/admin/dashboard",{ title: "Dashboard",orders });
        } else {
            res.redirect("/admin/login");
        }

      

    } catch (error) {
        throw new Error(error);
    }
});

exports.dashboard = asynchandler(async(req,res)=>{
    const orders = await order.find().populate({
        path:"orderItems",
        populate:{
            path:"product",
            populate:{
                path:"images",
            }
        }
    })
    try {
        res.render('./admin/pages/dashboard',{ title: "Dashboard",orders })
    } catch (error) {
        throw new Error(error);
    }
})




//Category
//GET methods

exports.categories = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        const categories = await Category.find();
        res.render("./admin/pages/categories",{ title: "Category",categories,messages })
    } catch (error) {
        throw new Error(error);
    }
})

//Add Category

exports.addcategorypage = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        res.render("./admin/pages/addcategory", { title: "Add Category",messages })
    } catch (error) {
        throw new Error(error);
    }
});

//Edit Category
//GET Method
exports.editcategorypage = asynchandler(async(req,res)=>{
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const messages = req.flash();
        const category = await Category.findById(id);
        res.render("./admin/pages/editcategory",{ title: "Edit Category",category,messages })
    } catch (error) {
        throw new Error(error);
    }
})

//POST methods

//Add Category

exports.addCategory = asynchandler(async (req, res) => {
    try {
        const existingCategory = await Category.findOne({title:{$regex: new RegExp(req.body.title, "i")}});
        if(existingCategory){
            req.flash("warning","Category already exist");
            res.redirect("/admin/addcategory");
        }else {
            const newCategory = await Category.create(req.body);
        req.flash("success", `${newCategory.title} added`);
        res.redirect("/admin/categories");
        }

        
    } catch (error) {
        throw new Error(error);
    }
});


//Unlist Category
// PUT Method

exports.unlist = asynchandler(async(req,res)=>{
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const UnlistedCategory = await Category.findByIdAndUpdate(
            id,
            {
                isListed:false,
            }
        );
        if(UnlistedCategory){
            req.flash("success",`${UnlistedCategory.title} is unlisted`);
            res.redirect("/admin/categories");
        }else{
            req.flash("danger", `Can't Unlist ${UnlistedCategory.title}`);
        }
    } catch ( error) {
      throw new Error(error);  
    }
});

//List Category
//PUT Method

exports.list = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {

        const listedCategory = await Category.findByIdAndUpdate(id, {isListed: true});
        if (listedCategory) {
            req.flash("success", `${listedCategory?.title} is listed`);
            res.redirect("/admin/categories");
        } else {
            req.flash("danger", `Can't List ${listedCategory.title}`);
        }
    } catch (error) {
        throw new Error(error);
    }
});

//Edit Category
//PUT Method

exports.editcategory = asynchandler(async (req, res) => {
    const id = req.params.id;
    // console.log(id);
    validateMongoDbId(id);
    try {
        const {title, isListed} = req.body;

        const editedCategory = await Category.findById(id);
        editedCategory.title = title;
        editedCategory.isListed = isListed;
        editedCategory.save();
        req.flash("success", `Category ${editedCategory.title} updated`);
        res.redirect("/admin/categories");
    } catch (error) {
        throw new Error(error);
    }
});

//Delete Category
//Delete method

exports.deleteCategory = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const deletedCategory = await Category.findByIdAndDelete(id);
        req.flash("success", `Category ${deletedCategory.title} deleted`);
        res.redirect("/admin/categories");
    } catch (error) {
        throw new Error(error);
    }
});

//Products
//GET METHOD

exports.productlist = asynchandler(async(req,res)=>{
    const messages = req.flash();
    const products = await Products.find()
    .populate("category")
    .populate("images");
    try {
        res.render("./admin/pages/productlist",{ title: "ProductList", messages, products,})
    } catch (error) {
        throw new Error(error);
    }
});



//Adding Product
//GET METHOD

exports.addproductpage = asynchandler(async(req,res)=>{
    // const messages = req.flash('error');
    try {
        const categories = await Category.find({ isListed: true });
        
        res.render("./admin/pages/addproduct", {title: "Add Products",categories })
    } catch (error) {
        throw new Error(error);
    }
})



//Edit Product
//GET METHOD

exports.editproductpage = asynchandler(async(req,res)=>{
    try {
        const id = req.params.id;
       
        validateMongoDbId(id);
        const categories = await Category.find({ isListed: true });
        const product = await Products.findById(id)
        .populate("category")
        .populate("images");
        res.render("admin/pages/editproduct", {title: "Add Products",categories,product})
    } catch (error) {
        throw new Error(error);
    }
});

//Add Product
//POST Method 

exports.createproduct = asynchandler(async(req,res)=>{
    try {

        const imageUrls = [];

    // Check if req.files exists and has images
    if (req.files && req.files.images.length > 0) {
      const images = req.files.images;

      for (const file of images) {
        try {
          const imageBuffer = await sharp(file.path)
            .resize(600, 800)
            .toBuffer();
          const thumbnailBuffer = await sharp(file.path)
            .resize(300, 300)
            .toBuffer();
          const imageUrl = path.join("/admin/uploads", file.filename);
          const thumbnailUrl = path.join("/admin/uploads", file.filename);
          imageUrls.push({ imageUrl, thumbnailUrl });
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }


        const image = await Image.create(imageUrls);
        const ids = image.map((image) => image._id);
  
        // console.log({data: req.body})

        const newProduct = await Products.create({
          title: req.body.title,
          category: req.body.category,
          description: req.body.description,
          productPrice: req.body.productPrice,
          salePrice: req.body.salePrice,
          images: ids,
          quantity: parseInt(req.body.quantity),
       
        });
        req.flash("success", "Product Created");
        res.redirect("/admin/productlist");

    } else {
        res.status(400).json({ error: "Invalid input: No images provided" });
      }

    } catch (error) {
        console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
    }
})


//EditProduct
//PUT Method

exports.updateProduct = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        console.log(req.body);
      const editedProduct = await Products.findByIdAndUpdate(id, req.body);
      req.flash("success", `Product ${editedProduct.title} updated`);
      res.redirect("/admin/productlist");
    } catch (error) {
      throw new Error(error);
    }
  });




  //Editing image
  exports.editImage = asynchandler(async (req, res) => {
    try {
      const imageId = req.params.id;
      const file = req.file;
      console.log("file", req.file);
      console.log(imageId);
      const imageBuffer = await sharp(file.path).resize(600, 800).toBuffer();
      const thumbnailBuffer = await sharp(file.path).resize(300, 300).toBuffer();
      const imageUrl = path.join("/admin/uploads", file.filename);
      const thumbnailUrl = path.join("/admin/uploads", file.filename);
  
      const images = await Image.findByIdAndUpdate(imageId, {
        imageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
      });
  
      req.flash("success", "Image updated");
      res.redirect("back");
    } catch (error) {
      throw new Error(error);
    }
  });





  //addImage
  exports. addNewImages = asynchandler(async (req, res) => {
    try {
      const files = req.files;
      const imageUrls = [];
      const productId = req.params.id;
  
      for (const file of files) {
        try {
          const imageBuffer = sharp(file.path).resize(600, 600).toBuffer();
          const thumbnailBuffer = sharp(file.path).resize(300, 300).toBuffer();
  
          const imageUrl = path.join("/admin/uploads", file.filename);
          const thumbnailUrl = path.join("/admin/uploads", file.filename);
          imageUrls.push(imageUrl, thumbnailUrl);
        } catch (error) {
          console.log("error processing in image", error);
        }
      }
  
        const image = await Image.create(imageUrls);
        const ids = image.map((image) => image._id);
        const product = await product.findByIdAndUpdate(productId, {
          $push: { images: ids },
        });
        req.flash("success", "Image added");
        res.redirect("back");
      
    } catch (error) {
     console.log(error.message);
    }
  });
  

    //listproduct
  //PUT Method

  exports.listProduct = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
      const updatedProduct = await Products.findByIdAndUpdate(id, {
        isListed: true,
      });

      req.flash("success", `${updatedProduct?.title} Listed`);
      res.redirect("/admin/productlist");
    } catch (error) {
      throw new Error(error);
    }
  });




//unlist product
//PUT Method
exports.unlistProdcut = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
      const updatedProduct = await Products.findByIdAndUpdate(id, {
        isListed: false,
      });
      req.flash("warning", `${updatedProduct.title} Unllisted`);
      res.redirect("/admin/productlist");
    } catch (error) {
      throw new Error(error);
    }
  });

//Customers
//GET method

exports.customerspage = asynchandler(async(req,res)=>{
    try {
        const messages = req.flash();
        const customers = await User.find({ role: roles.user });
        // console.log(customers);
        res.render("./admin/pages/customers",{ title: "Customer" ,customers, messages, roles })
    } catch (error) {
        throw new Error(error);
    }
});






//BlockCustomers
//PUT Method

exports.blockCustomer = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const blockedCustomer = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: true,
            },
        );
        if (blockedCustomer) {
            req.flash("success", `${blockedCustomer.email} Blocked Successfully`);
            res.redirect("/admin/customers");
        } else {
            req.flash("danger", `Can't block ${blockedCustomer}`);
            res.redirect("/admin/customers");
        }
    } catch (error) {
        throw new Error(error);
    }
});


//Unblock Customers
//PUT Method
exports.unblockCustomer = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const unblockCustomer = await User.findByIdAndUpdate(
            id,
            {
                isBlocked: false,
            },
        );
        if (unblockCustomer) {
            req.flash("success", `${unblockCustomer.email} Unblocked Successfully`);
            res.redirect("/admin/customers");
        } else {
            req.flash("danger", `Can't Unblock ${unblockCustomer}`);
            res.redirect("/admin/customers");
        }
    } catch (error) {
        throw new Error(error);
    }
});





// exports.orderlist = asynchandler(async(req,res)=>{
//     try {
//         res.render("./admin/pages/orderlist",{title: "Orders",})
//     } catch (error) {
//         throw new Error(error);
//     }
// })





// exports.orderdetails = asynchandler(async(req,res)=>{
//     try {
//         res.render("./admin/pages/orderdetails",{title:"Order Details"})
//     } catch (error) {
//         throw new Error(error);
//     }
// })







