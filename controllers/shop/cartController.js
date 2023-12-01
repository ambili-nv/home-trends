const asynhandler = require("express-async-handler");

const validateMongoDbId = require('../../utils/validateMongoDbId');

const Cart = require("../../models/cartModel");
const User = require("../../models/userModel");
const Product = require("../../models/productModel");


function calculateCartTotal(products){
    let subtotal = 0;
    for (const product of products){
        const productTotal = parseFloat(product.product.salePrice) * product.quantity;
        subtotal += productTotal;
    }
    const total = subtotal;
    return {subtotal,total,};
}

const findCartItem = async(userId,productId)=>{
    return await Cart.findOne({user:userId,"products.product":productId});
};

const findProductById = async (productId)=>{
    return await Product.findById(productId);
};

const incrementQuantity = async (userId,productId,res)=>{
    const updatedProduct = await findCartItem(userId, productId);
    console.log(updatedProduct);

    if(!updatedProduct){
        return res.json({message:"Product not found in cart", status:"error"});
    }

    const foundProduct = updatedProduct.products.find((cartProduct)=>cartProduct.product.equals(productId));

    const product = await findProductById(productId);

    if(foundProduct.quantity < product.quantity) {
        foundProduct.quantity += 1;

        await updatedProduct.save();

        const productTotal = product.salePrice * foundProduct.quantity;
        const cart = await Cart.findOne({user:userId}).populate("products.product");
        const {subtotal,total,} = calculateCartTotal(cart.products);


        res.json({
            message: "Quantity Increased",
            quantity: foundProduct.quantity,
            productTotal,
            status: "success",
            subtotal: subtotal,
            total: total,
           
        });
    } else {
        const productTotal = product.salePrice * foundProduct.quantity;
        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total,} = calculateCartTotal(cart.products);
        res.json({
            message: "Out of Stock",
            status: "danger",
            quantity: foundProduct.quantity,
            productTotal,
            subtotal: subtotal,
            total: total,
            
        });
    }

    
};


const decrementQuantity = async (userId, productId, res) => {
    const updatedCart = await Cart.findOne({ user: userId });
    const productToDecrement = updatedCart.products.find((item) => item.product.equals(productId));

    if (productToDecrement) {
        productToDecrement.quantity -= 1;

        if (productToDecrement.quantity <= 0) {
            updatedCart.products = updatedCart.products.filter((item) => !item.product.equals(productId));
        }

        const product = await findProductById(productId);

        await updatedCart.save();

        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total,  } = calculateCartTotal(cart.products);

        res.json({
            message: "Quantity Decreased",
            quantity: productToDecrement.quantity,
            status: "warning",
            productTotal: product.salePrice * productToDecrement.quantity,
            subtotal,
            total,
           
        });
    } else {
        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total, } = calculateCartTotal(cart.products);
        const product = await findProductById(productId);
        res.json({
            message: "Product not found in the cart.",
            status: "error",
            subtotal,
            total,
            productTotal: product.salePrice * productToDecrement.quantity,
        });
    }
};


//CartPage
//GET Method

exports.cartpage = asynhandler(async(req,res)=>{
    const userId = req.user.id;
    const messages = req.flash();
    try {
        const cart = await Cart.findOne({user:userId}).populate({path:"products.product",populate:{path:"images",model:"Images",},}).exec();

        if(!cart){
            res.render("shop/pages/cart",{title:"Cart",page:"cart",messages,cartItems:null,user: req.user})
        } else{
            const {subtotal ,total,} = calculateCartTotal(cart.products);
            res.render("shop/pages/cart",{title:"cart", page:"cart",cartItems: cart,messages,subtotal,total,});
        }

    } catch (error) {
        throw new Error(error);
    }
})

//add to cart 
//GET Method

exports.addToCart = asynhandler(async(req,res)=>{
    const productId = req.params.id;
    // console.log(productId);
    const userId = req.user.id;
    // console.log(userId);
    validateMongoDbId(productId);
    try {
        const product = await Product.findById(productId);

        if(!product){
            return res.status(404).json({message:"product not found"});
        }

        if(product.quantity<1){
            return res.status(404).json({message:"product is out of stock"});
        }

        let cart = await Cart.findOne({user:userId});
        console.log(cart);

        if(!cart){
            cart = await Cart.create({user:userId, products:[{product:productId,quantity:1}],});
        }else{
            const existingProduct = cart.products.find((item)=> item.product.equals(productId));

        if(existingProduct){
            if(product.quantity <= existingProduct.quantity){
                return res.json({message:"out of stock",status:"danger",count:cart.products.length});
            }
            existingProduct.quantity += 1;
        }else{
            cart.products.push({product:productId,quantity:1});
        }

        await cart.save();
        // console.log(cart);
    }
    req.flash("sucess",`Product added to cart`)
    res.json({ message: "Product Added to Cart", count: cart.products.length, status: "success" });

    } catch (error) {
        throw new Error(error);
    }
});


//Remove From Cart
exports.removeCart = asynhandler(async(req,res)=>{
    const productId = req.params.id;
    const userId = req.user.id;
    validateMongoDbId(productId);
    try {
        const cart = await Cart.findOne({user:userId});
        if(cart){
            cart.products = cart.products.filter((product)=>product.product.toString() !== productId);
            await cart.save();
        }
        req.flash("warning",`item removed`);
        res.redirect("back");
    } catch (error) {
        
    }
});


//Add Quantity
exports.addQuantity = asynhandler(async(req,res)=>{
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await incrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error)
    }
});

//Decrement Quantity
exports.decQuantity = asynhandler(async(req,res)=>{
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        validateMongoDbId(productId);

        await decrementQuantity(userId, productId, res);
    } catch (error) {
        throw new Error(error)
    }
});