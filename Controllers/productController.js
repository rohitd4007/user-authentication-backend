const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const redis = require("../config/redis"); // Optional, if Redis is used

// Create Product
const createProduct = async (req, res) => {
    const {
        product_brand,
        product_title,
        product_selling_price,
        product_price,
        product_discount,
    } = req.body;

    try {
        // Optimize Cloudinary upload (auto quality & format)
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "products",
            use_filename: true,
            quality: "auto",
            format: "auto",
        });

        // Create new product
        const product = new Product({
            product_brand,
            product_title,
            product_selling_price,
            product_price,
            product_discount,
            product_image_url: result.secure_url,
        });

        await product.save();

        // Clear cached products (if Redis is used)
        if (redis) {
            await redis.del("all_products");
            await redis.del("products:*"); // More comprehensive cache clearance
        }

        res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error creating product", error: error.message });
    }
};

// Get Product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select(
            "product_brand product_title product_selling_price product_price product_discount product_image_url"
        );

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error("Error retrieving product:", error);
        res.status(500).json({ message: "Error retrieving product", error: error.message });
    }
};

// Get All Products with Pagination & Caching
const getAllProducts = async (req, res) => {
    console.log("getAllProducts::::::::::::");
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Check Redis cache (if Redis is available)
        if (redis) {
            const cachedData = await redis.get(`products_page_${page}`);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
        }

        // Fetch products with pagination & select only required fields
        const products = await Product.find()
            .select("product_brand product_title product_selling_price product_image_url")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Sort by latest

        // Consider adding total count for pagination metadata
        const total = await Product.countDocuments();
        const totalPages = Math.ceil(total / limit);

        // Cache results (if Redis is used)
        if (redis) {
            // Include pagination metadata in cache
            const cacheData = { products, page, totalPages, total };
            await redis.setex(`products:page_${page}`, 3600, JSON.stringify(cacheData));
        }

        res.status(200).json(products);
    } catch (error) {
        console.error("Error retrieving products:", error);
        res.status(500).json({ message: "Error retrieving products", error: error.message });
    }
};

module.exports = {
    createProduct,
    getProductById,
    getAllProducts,
};
