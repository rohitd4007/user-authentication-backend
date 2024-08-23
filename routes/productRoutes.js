const express = require('express');
const { createProduct, getProductById, getAllProducts } = require('../Controllers/productController');
const upload = require('../middlewares/multerConfig');

const router = express.Router();

router.post('/uploadProduct', upload.single('product_image'), createProduct);

router.get('/products/:id', getProductById);

router.get('/all-products', getAllProducts);

module.exports = router;
