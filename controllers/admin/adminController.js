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
const mongoose = require('mongoose');
const numeral = require("numeral");
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
            res.render("admin/pages/dashboard",{ title: "Dashboard",orders });
        } else {
            res.redirect("/admin/login");
        }

    

    } catch (error) {
        throw new Error(error);
    }
});

// exports.dashboard = asynchandler(async(req,res)=>{
//     try {
//     const user = req?.user;
//     const orders = await order.find().limit(5).populate({
//         path:"orderItems",
//         populate:{
//             path:"product",
//             populate:{
//                 path:"images",    
//             }
            
//         },
//         path:"user",
//         select:"name",
//     }).populate("orderItems").select("totalAmount orderDate totalPrice").sort({_id:-1});
    
//     let totalSalesAmount = 0;
//     orders.forEach((order)=>{
//         totalSalesAmount += order.totalPrice;
//     });

//     totalSalesAmount = numeral(totalSalesAmount).format("0.0a");

//     const totalOrderCount = await order.countDocuments();
//     const totalActiveUserCount = await User.countDocuments({ isBlocked: false });

//         res.render('admin/pages/dashboard',{ title: "Dashboard",orders,user,totalSalesAmount,totalOrderCount,totalActiveUserCount })
//     } catch (error) {
//         throw new Error(error);
//     }
// });


exports.dashboard = asynchandler(async (req, res) => {
    try {
        const user = req?.user;
        const recentOrders = await order.find().limit(5).populate({
            path:"user",
            select:"firstName lastname",
        }).populate("orderItems").select("totalAmount orderDate totalPrice").sort({_id:-1});

        let totalSalesAmount = 0;
        recentOrders.forEach((order)=>{
            totalSalesAmount += order.totalPrice;
        });

        totalSalesAmount = numeral(totalSalesAmount).format("0.0a");

        

        const totalOrderCount = await order.countDocuments();
        const totalActiveUserCount = await User.countDocuments({ isBlocked: false });
        res.render("admin/pages/dashboard", { title: "Dashboard",user,recentOrders,totalSalesAmount,totalOrderCount,totalActiveUserCount,});
    } catch (error) {
        throw new Error(error);
    }
});








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

// exports.editcategory = asynchandler(async (req, res) => {
//     const id = req.params.id;
//     // console.log(id);
//     validateMongoDbId(id);
//     try {
//         const {title, isListed, offer, offerDescription, startDate, endDate} = req.body;

//         const editedCategory = await Category.findById(id);
//         editedCategory.title = title;
//         editedCategory.isListed = isListed;
//         editedCategory.offer = offer;
//         editedCategory.offerDescription = offerDescription;
//         editedCategory.startDate = startDate;
//         editedCategory.endDate = endDate;
//         editedCategory.save();
//         req.flash("success", `Category ${editedCategory.title} updated`);
//         res.redirect("/admin/categories");
//     } catch (error) {
//         throw new Error(error);
//     }
// });



exports.editcategory = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const { title, isListed, offer, offerDescription, startDate, endDate } = req.body;

        const editedCategory = await Category.findById(id);
        editedCategory.title = title;
        editedCategory.isListed = isListed;
        editedCategory.offer = offer;
        editedCategory.offerDescription = offerDescription;
        editedCategory.startDate = startDate;
        editedCategory.endDate = endDate;
        await editedCategory.save();
        console.log(editedCategory);

        req.flash("success", `Category ${editedCategory.title} updated`);
        res.redirect("/admin/categories");

        if (req.body.offer && parseFloat(req.body.offer) !== 0) {
            
            
                const products = await Products.find({ category: editedCategory._id });

                console.log("Category ID:", editedCategory._id);
                console.log("Retrieved Products:", products);
                console.log(products,"products");
                for (const product of products) {
                    const newPrice = product.productPrice - (product.productPrice * (parseFloat(offer) / 100));
                    product.salePrice = Math.round(newPrice);
                    await product.save();
                }
            
        } else {
            // No offer or offer is zero, reset product prices to their original values
            
            const products = await Products.findById({ category: editedCategory._id });
            

            for (const product of products) {
                product.salePrice = product.productPrice;
                await product.save();
            }
        }
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

    const itemsperpage = 5;
        const currentpage = parseInt(req.query.page) || 1;
        const startindex = (currentpage - 1) * itemsperpage;
        const endindex = startindex + itemsperpage;
        const totalpages = Math.ceil(products.length / 5);
        const currentproduct = products.slice(startindex,endindex);

    try {
        res.render("./admin/pages/productlist",{ title: "ProductList", messages, products,products:currentproduct,totalpages,currentpage})
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

// exports.updateProduct = asynchandler(async (req, res) => {
//     const id = req.params.id;
//     validateMongoDbId(id);
//     try {
//         console.log(req.body);
//       const editedProduct = await Products.findByIdAndUpdate(id, req.body);
//       req.flash("success", `Product ${editedProduct.title} updated`);
//       res.redirect("/admin/productlist");
//     } catch (error) {
//       throw new Error(error);
//     }
//   });

// exports.updateProduct = asynchandler(async (req, res) => {
//     const id = req.params.id;
//     validateMongoDbId(id);
//     try {
//         const product = await Products.findById(id);

//         if (req.body.offer && parseFloat(req.body.offer) !== 0) {
//             const offer = parseFloat(req.body.offer);
//             console.log(offer,"offerrrrrrrrrr");
//             const newPrice = product.productPrice - (product.productPrice * (offer / 100));
//             product.salePrice = Math.round(newPrice);
//             const nw = await product.save();
//             console.log(nw,"saved nw product in");
//         } else {
//             // If no offer, update the product using regular assignment
//             Object.assign(product, req.body);
            
//         }

//         const nw = await product.save();
//         console.log(nw,"saved nw product");
        

//         if (req.body.offer && parseFloat(req.body.offer) === 0) {
//             // Flash message when there's no offer and the product is updated
//             req.flash("success", `Product ${product.title} updated`);
//         } else {
//             // Fetch the updated product after saving to get the editedProduct information
//             const editedProduct = await Products.findById(id);
//             req.flash("success", `Product ${editedProduct.title} updateds`);
//         }
//         await product.save();

//         res.redirect("/admin/productlist");
//     } catch (error) {
//         throw new Error(error);
//     }
// });

exports.updateProduct = asynchandler(async (req, res) => {
    const id = req.params.id;
    validateMongoDbId(id);
    try {
        const product = await Products.findById(id);
        const productOffer = parseFloat(product.offer);
        const requestBodyOffer = parseFloat(req.body.offer);
       
if (productOffer !== requestBodyOffer) {
            const offer = parseFloat(req.body.offer);
            const newPrice = product.productPrice - (product.productPrice * (offer / 100));
            product.salePrice = Math.round(newPrice);
            product.offer = offer; 
        } else {
            Object.assign(product, req.body);
        }

        await product.save();

        if (req.body.offer && parseFloat(req.body.offer) === 0) {
            req.flash("success", `Product ${product.title} updateds`);
        } else {            
            const editedProduct = await Products.findById(id);
            req.flash("success", `Product ${editedProduct.title} updated`);
        }

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

exports.salesReportpage = asynchandler(async (req, res) => {
    try {
        res.render("admin/pages/sales-report", { title: "Sales Report" });
    } catch (error) {
        throw new Error(error);
    }
});

// exports.generateSalesReport = async (req, res, next) => {
//     try {
//         const fromDate = new Date(req.query.fromDate);
//         const toDate = new Date(req.query.toDate);
//         const salesData = await order.find({
//             orderedDate: {
//                 $gte: fromDate,
//                 $lte: toDate,
//             },
//         }).select("orderId totalPrice orderedDate payment_method -_id");

//         res.status(200).json(salesData);
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// };

exports.generateSalesReport = async (req, res, next) => {
    try {
        const fromDate = new Date(req.query.fromDate);
        const toDate = new Date(req.query.toDate);
        // Adjust the toDate to include orders on the toDate as well
        toDate.setDate(toDate.getDate() + 1);

        const salesData = await order.find({
            orderedDate: {
                $gte: fromDate,
                $lte: toDate,
            },
        }).select("orderId totalPrice orderedDate payment_method -_id");

        res.status(200).json(salesData);
    } catch (error) {
        console.error(error);
        next(error);
    }
};



exports.getSalesData = async (req, res) => {
    try {
        const pipeline = [
            {
                $project: {
                    year: { $year: "$orderedDate" },
                    month: { $month: "$orderedDate" },
                    totalPrice: 1,
                },
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    totalSales: { $sum: "$totalPrice" },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: {
                                    if: { $lt: ["$_id.month", 10] },
                                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                                    else: { $toString: "$_id.month" },
                                },
                            },
                        ],
                    },
                    sales: "$totalSales",
                },
            },
        ];

        const monthlySalesArray = await order.aggregate(pipeline);
       

        res.json(monthlySalesArray);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



exports.getSalesDataYearly = async (req, res) => {
    try {
        const yearlyPipeline = [
            {
              $project: {
                year: { $year: "$orderedDate" },
                totalPrice: 1,
              },
            },
            {
              $group: {
                _id: { year: "$year" },
                totalSales: { $sum: "$totalPrice" },
              },
            },
            {
              $project: {
                _id: 0,
                year: { $toString: "$_id.year" },
                sales: "$totalSales",
              },
            },
          ];
          

        const yearlySalesArray = await order.aggregate(yearlyPipeline);
        
        res.json(yearlySalesArray);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



exports.getSalesDataWeekly =async (req, res) => {
    try {
        const weeklySalesPipeline = [
            {
              $project: {
                week: { $week: "$orderedDate" },
                totalPrice: 1,
              },
            },
            {
                $group: {
                    _id: { week: { $mod: ["$week", 7] } },
                    totalSales: { $sum: "$totalPrice" },
                  },
            },
            {
              $project: {
                _id: 0,
                week: { $toString: "$_id.week" },
                dayOfWeek: { $add: ["$_id.week", 1] },
                sales: "$totalSales",
              },
            },
            {
                $sort: { dayOfWeek: 1 },
              },
        ];
          

        const weeklySalesArray = await order.aggregate(weeklySalesPipeline);
        console.log(weeklySalesArray);

        res.json(weeklySalesArray);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};




