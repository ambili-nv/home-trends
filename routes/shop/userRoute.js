const express = require('express');
const router = express.Router();
const authController = require('../../controllers/shop/authController')
const userController = require('../../controllers/shop/userController')
const productController = require('../../controllers/shop/productController');
const cartControlller = require('../../controllers/shop/cartController');
const checkoutController = require("../../controllers/shop/checkoutController");
const orderController = require('../../controllers/shop/orderController');
const wishlistController = require('../../controllers/shop/wishlistController')
const {upload} =require("../../config/upload");
const { isBlockedUser } = require('../../Middlewares/authMiddleware');

router.use((req, res, next) => {
    req.app.set("layout", "shop/layout");
    next()
})

router.get('/',userController.loadHome)
router.get('/home',userController.loadHome)
router.get('/about_us',userController.loadAboutus)
router.get('/contact',userController.loadContact)



//products
router.get("/shop",productController.shoppage);
router.get("/shops",productController.shoppage);
router.get("/product/:id",productController.singleProduct)


//Cart
//GET Method
router.get("/cart",isBlockedUser,cartControlller.cartpage)
router.get("/cart/add/:id", cartControlller.addToCart);
router.get("/remove/:id", cartControlller.removeCart);
router.get("/cart/inc/:id",cartControlller.addQuantity)
router.get("/cart/dec/:id",cartControlller.decQuantity)




//UserProfile
//GET Method
router.get("/userprofile",userController.loadProfile);
router.get("/editprofile/:id",userController.editProfile);
router.put("/profile/edit/:id",upload.single("file"), userController.editProfile);



router.get("/address",userController.addresspage)

router.get("/add-address",userController.addAddresspage)


router.post("/add-address", userController.addAddress);

router.get("/address/edit/:id", userController.editAddresspage);
router.put("/address/edit/:id", userController.editaddress);
router.delete("/address/delete/:id",userController.deleteAddress)



//Checkout Routes

router.post("/checkout",checkoutController.checkoutpage);
router.get("/get", checkoutController.getCartData);
router.post("/place-order", checkoutController.placeOrder);
router.get("/order-placed/:id", checkoutController.orderPlaced);
router.post("/verify-payment", checkoutController.verifyPayment);
router.post("/update", checkoutController.updateCheckoutPage);

//Order routes
router.get("/orders",orderController.orderpage);
router.get("/orders/:id", orderController.singleOrder);
router.get("/orders/:id", orderController.cancelOrder);
router.put("/orders/single/:id", orderController.cancelSingleOrder);
router.put("/orders/return/:id", orderController.returnOrder);
router.get("/download/:id", orderController.donwloadInvoice);



//wallet 

router.get("/wallet",userController.walletPage)
router.post("/coupon", checkoutController.updateCoupon);


//wishlist
router.get("/wishlist",wishlistController.wishlistpage);
router.get("/wishlist/toggle/:id", wishlistController.toggleWishlist);
router.get("/wishlist/remove/:id", wishlistController.removeWishlist);









module.exports=router;
