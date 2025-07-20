const express = require('express');
const router = new express.Router();

// Utils
const {validateFileType} = require("../utils/validate_file_type");

// Middlerware
const { validate_refresh_token, validate_auth_token, admin_access} = require("../middleware/authentication");

const {create_category, create_product, update_product} = require("../controller/product_cntrll");

// routes
router.post("/add_category", validate_auth_token, validate_refresh_token, admin_access, create_category);
router.post("/add_product", validate_auth_token, validate_refresh_token, admin_access, create_product);
router.put("/update_product", validate_auth_token, validate_refresh_token, admin_access, update_product);


module.exports = router;