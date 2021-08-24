//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("/public/"));

mongoose.connect("mongodb+srv://admin:mg200696@cluster0.4pex9.mongodb.net/productsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const productsSchema = {
    name: String,
    details: String,
    price: Number,
    category: String,
    stock: Number,
    discount: Number
};


const Product = mongoose.model("Product", productsSchema);


const categoriesSchema = {
    name: String,
    size: Number,
    articles: Array,
    maxDiscount: Number,
    minDiscount: Number
};


const Category = mongoose.model("Category", categoriesSchema);


const discountsSchema = {
    off: Number,
    size: Number,
    articles: Array,

};


const Discount = mongoose.model("Discount", discountsSchema);






app.get("/", (req, res) => {
    Product.find({},(err,results) => {
        const products=results;
        results.sort((a,b) => (-a.discount + b.discount) );
        const specialOffer = results;
        
       
        res.render("Home",{
            specialOffer: specialOffer,
            products: products
        });
    })
    
});

app.get("/Dashboard", (req, res) => {



    Product.find({}, (err, results) => {
        const updateCategories = [];
        const updateDiscounts = [];
        const groupedByCategory = _.groupBy(results, "category");
        const groupedByDiscount = _.groupBy(results, "discount");
        const categories = Object.entries(groupedByCategory);
        const discounts = Object.entries(groupedByDiscount);



        categories.forEach((currentCategory) => {

            const categoryDiscount = [];

            currentCategory[1].forEach(article => {
                categoryDiscount.push(article.discount);
            });

            categoryDiscount.sort((a, b) => a - b);


            updateCategories.push({
                name: currentCategory[0],
                size: currentCategory[1].length,
                articles: currentCategory[1],
                minDiscount: categoryDiscount[0],
                maxDiscount: categoryDiscount[categoryDiscount.length - 1]
            })

        });

        updateCategories.sort((a, b) => (a.size > b.size) ? -1 : ((b.size > a.size) ? 1 : 0));

        discounts.sort((a, b) => (a[1].length > b[1].length) ? -1 : ((b[1].length > a[1].length) ? 1 : 0));




        discounts.forEach((currentDiscount) => {
            updateDiscounts.push({
                off: currentDiscount[0],
                size: currentDiscount[1].length,
                articles: currentDiscount[1]
            });
        });



        Discount.deleteMany({}, (err) => {
            if (err) {
                console.log(err);
            }
        });

        Discount.insertMany(updateDiscounts);





        Category.deleteMany({}, (err) => {
            if (err) {
                console.log(err);
            }
        });

        Category.insertMany(updateCategories);

        const categoryMaxOffer = [];
        const categoryMinOffer = [];

        updateCategories.forEach(value => {
            categoryMaxOffer.push({
                category: value.name,
                discountValue: value.maxDiscount
            });
            categoryMinOffer.push({
                category: value.name,
                discountValue: value.minDiscount
            });
        });

        categoryMinOffer.sort((a, b) => (b.discountValue - a.discountValue));
        categoryMaxOffer.sort((a, b) => (b.discountValue - a.discountValue));
        




        res.render("Dashboard", {
            maxOffer: categoryMaxOffer,
            minOffer: categoryMinOffer,
            categories: updateCategories,
            offers: updateDiscounts
        });


    });






});

app.get("/List", (req, res) => {
    Product.find({}, (err, results) => {


        



        res.render("List", {
            products: results,
        });
    });


});


app.get("/Details", (req, res) => {
    Product.find({}, (err, results) => {

        results.sort((a, b) => (b.price - a.price));
        res.render("Details", {
            products: results,
        });
    })
});


app.post("/addproduct", (req, res) => {
    const name = req.body.productName;
    const details = req.body.productDetail;
    const price = req.body.productPrice;
    const discount = req.body.productDiscount;
    const category = req.body.productCategory;
    const stock = req.body.productStock;
    Product.insertMany({
        name: name,
        details: details,
        price: price,
        stock: stock,
        discount: discount,
        category: category
    });

    res.redirect("List");
});


app.get("/:productDetail",(req,res)=>{
    const productDetail = req.params.productDetail
    Product.findOne({name:productDetail},(err,result) => {
        console.log(result);

        res.render("ProductDetail",{
            product:result
        });
    });
});

app.listen(3000, function () {
    console.log("Server started!");
});
