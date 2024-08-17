const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const createProduct = async (req, res) => {
    const {
        product_brand,
        product_title,
        product_selling_price,
        product_price,
        product_discount,
    } = req.body;

    try {
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',  // Optional: organize your uploads in folders
            use_filename: true,
        });

        // Create new product
        const product = new Product({
            product_brand,
            product_title,
            product_selling_price,
            product_price,
            product_discount,
            product_image_url: result.secure_url,  // Use the Cloudinary URL
        });

        await product.save();

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};
module.exports = {
    createProduct,
};
