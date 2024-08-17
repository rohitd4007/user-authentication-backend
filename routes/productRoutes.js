const express = require('express');
const { createProduct } = require('../Controllers/productController');
const upload = require('../middlewares/multerConfig');

const router = express.Router();

router.post('/uploadProduct', upload.single('product_image'), createProduct);

module.exports = router;
