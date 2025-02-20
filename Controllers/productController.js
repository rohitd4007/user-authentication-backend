const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const redis = require('../config/redis');

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
        // Upload image to Cloudinary with optimization
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'products',
            use_filename: true,
            quality: "auto",    // Optimize image quality
            format: "auto",     // Optimize format
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

        // Clear all product caches when new product is added
        if (redis) {
            try {
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    await redis.del(keys);
                    console.log('All product caches cleared');
                }
            } catch (redisError) {
                console.error('Redis cache clearing error:', redisError);
            }
        }

        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Get a product by ID with caching
const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        // Try to get from cache first
        if (redis) {
            try {
                const cachedProduct = await redis.get(`product:${productId}`);
                if (cachedProduct) {
                    return res.status(200).json(JSON.parse(cachedProduct));
                }
            } catch (redisError) {
                console.error('Redis get error:', redisError);
                // Continue to database if Redis fails
            }
        }

        // Get from database
        const product = await Product.findById(productId).select(
            'product_brand product_title product_selling_price product_price product_discount product_image_url'
        );

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Cache the product
        if (redis) {
            try {
                await redis.setex(`product:${productId}`, 3600, JSON.stringify(product));
            } catch (redisError) {
                console.error('Redis set error:', redisError);
                // Continue if Redis fails
            }
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error retrieving product:', error);
        res.status(500).json({ message: 'Error retrieving product', error: error.message });
    }
};

// Get all products with pagination and safe caching
const getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log('Query parameters:', { page, limit, skip });

        // First, let's check if products exist without any conditions
        const checkProducts = await Product.find();
        console.log('Total products in DB (raw check):', checkProducts.length);

        // If no products in DB, return empty response immediately
        if (checkProducts.length === 0) {
            return res.status(200).json({
                products: [],
                pagination: {
                    page,
                    totalPages: 0,
                    total: 0,
                    limit
                }
            });
        }

        // Get from database with pagination
        const products = await Product.find()
            .select('product_brand product_title product_selling_price product_image_url')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        console.log('Products found after query:', products);

        const total = checkProducts.length;
        const totalPages = Math.ceil(total / limit);

        const responseData = {
            products,
            pagination: {
                page,
                totalPages,
                total,
                limit
            }
        };

        // Cache the results only if we have products
        if (redis && products.length > 0) {
            try {
                const cacheKey = `products:page_${page}`;
                // Clear old cache
                await redis.del(cacheKey);
                // Set new cache
                await redis.setex(cacheKey, 3600, JSON.stringify(responseData));
                console.log('New data cached successfully');
            } catch (redisError) {
                console.error('Redis cache error:', redisError);
                // Continue without caching
            }
        }

        console.log('Sending response data:', responseData);
        res.status(200).json(responseData);

    } catch (error) {
        console.error('Error retrieving products:', error);
        res.status(500).json({ message: 'Error retrieving products', error: error.message });
    }
};


module.exports = {
    createProduct,
    getProductById,
    getAllProducts,
    testProducts  // Add this to exports
};
