const mongoose = require('mongoose')


const productSchema = new mongoose.Schema({
    product_brand: {
        type: String,
        required: true
    },
    product_title: {
        type: String,
        required: true
    },
    product_selling_price: {
        type: String,
        required: true
    },
    product_price: {
        type: String,
        required: true
    },
    product_discount: {
        type: String,
        required: true
    },
    product_image_url: {
        type: String,
        required: true
    }
}, { timestamps: true })


const Product = mongoose.model('Product', productSchema)

module.exports = Product;