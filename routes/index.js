const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const supplierController = require('../controllers/supplierController');


/* GET home page. */
// router.get('/', productController.displayProducts);
router.get('/', productController.displayProductsWithSuppliers);
router.post('/', productController.filterBySupplier);


router.get('/supplier/:id', supplierController.displaySupplier);

module.exports = router;
