const express = require('express');
const router = express();

const adminController = require('../../controllers/admin/adminController');
const orderController = require('../../controllers/admin/orderController')
const { uploadMultiple, uploadSingle,upload } = require('../../config/upload');
const { body } = require('express-validator');
router.use((req, res, next) => {
    req.app.set("layout", "admin/layout");
    next()
})

router.get("/", adminController.homepage);


router.get("/dashboard", adminController.dashboard);







//category

//GET methods
router.get('/categories',adminController.categories);
router.get('/addcategory',adminController.addcategorypage);
router.get("/edit/:id", adminController.editcategorypage);


router.post('/addcategory',adminController.addCategory);
router.put("/unlist/:id",adminController.unlist);
router.put("/list/:id",adminController.list);
router.put("/edit/:id", adminController.editcategory);
router.delete("/delete/:id", adminController.deleteCategory);

//Product
//GET Method

router.get('/productlist',adminController.productlist);
router.get('/addnewproduct',adminController.addproductpage);
router.get('/editproduct/:id',adminController.editproductpage);

//POST Method
router.post('/add', uploadMultiple, adminController.createproduct);



router.put('/product/editImage/:id',upload.single('images'),adminController.editImage)
router.put('/product/editImage/upload/:id',upload.array("files",4),adminController.addNewImages)
// router.delete('/product/deleteImage/:id',adminController.deleteImage)



router.put('/editproduct/:id',adminController.updateProduct);

router.put('/product/list/:id',adminController.listProduct);
router.put('/product/unlist/:id',adminController.unlistProdcut);

//Customers
//GET Method

router.get('/customers',adminController.customerspage);
router.put("/block/:id",adminController.blockCustomer);
router.put("/unblock/:id",adminController.unblockCustomer);



//orders page
//GET Method
router.get("/orderlist", orderController.ordersListPage);
router.get("/edit-order/:id", orderController.editOrder);
router.put("/order/update/:id", orderController.updateOrderStatus);

module.exports=router;