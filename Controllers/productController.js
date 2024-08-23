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

// Get a product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving product', error: error.message });
    }
};

// Get all products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();

        res.status(200).json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving products', error: error.message });
    }
};

module.exports = {
    createProduct,
    getProductById,
    getAllProducts,
};
