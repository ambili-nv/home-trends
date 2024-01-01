const express = require('express');
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const dotenv = require("dotenv").config();
const connectDatabase = require("./config/db");
const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const connectMongo = require("connect-mongo");
const  { default: mongoose } = require('mongoose');
const { ensureAdmin } = require("./Middlewares/authMiddleware");
const methodOverride = require("method-override");
const nocache = require("nocache");
const Cart = require("./models/cartModel");
const Category = require("./models/categoryModel");
const Razorpay = require('razorpay')

mongoose.connect('mongodb://127.0.0.1:27017/home_trend');





const {ensureUser,
    isBlockedAdmin,
    isBlockedUser,
} = require("./Middlewares/authMiddleware");
const {ensureLoggedIn, ensureLoggedOut } = require("connect-ensure-login");

const app = express();


const PORT = 5000;

// connectDatabase();

// Static files
app.use(express.static("public"));
app.use("/admin", express.static(__dirname + "/public/admin"))
app.use("/shop", express.static(__dirname + "/public/shop"))
app.use(morgan("dev"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method")) 
app.use(nocache());




app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
        },

    })
);


app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use(async (req, res, next) => {
    const categories = await Category.find({ isListed: true });

    if (req?.user?.role === roles.user) {
        const cart = await Cart.find({ user: req.user.id });

        // Check if the cart array has any elements
        if (cart && cart.length > 0) {
            res.locals.cartCount = cart[0].products.length; 
        } else {
            res.locals.cartCount = 0;
        }
    }

    res.locals.categories = categories;
    res.locals.user = req.user;
    next();
});

app.use(connectFlash());

app.set('view engine', 'ejs');
app.use(expressLayouts);








//admin routes
const adminRoute = require('./routes/admin/adminRoute');
app.use('/admin',adminRoute);

const adminAuthRoute = require('./routes/admin/authRoute')
app.use('/admin',adminAuthRoute)

//user routes
const userRoute = require('./routes/shop/userRoute');
app.use('/',userRoute)

const authRoute = require('./routes/shop/authRoute');
app.use('/',authRoute)
const { roles } = require("./utils/constants");



// app.use((req,res)=>{
//     res.render("404",{title:"404", page:"404"});
// });


app.listen(PORT,()=>{
    console.log(`Server started http://localhost:${PORT}`);
})