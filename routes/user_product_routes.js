const express = require('express');
const router = new express.Router();

// Utils
const {validateFileType} = require("../utils/validate_file_type");

// Middlerware
const { validate_refresh_token, validate_auth_token} = require("../middleware/authentication");

const {
  get_all_category, 
  get_category_brand, 
  get_product_created_admin, 
  get_all_product, 
  get_product,
  add_rating
} = require("../controller/product_cntrll");

// routes
router.get("/get_category", validate_auth_token, validate_refresh_token, get_category_brand);
router.get("/get_all_category", validate_auth_token, validate_refresh_token, get_all_category);
router.get("/get_product_created_by", validate_auth_token, validate_refresh_token, get_product_created_admin);
router.get("/get_all_product", validate_auth_token, validate_refresh_token, get_all_product);
router.get("/get_product", validate_auth_token, validate_refresh_token, get_product);
router.post("/add_rating", validate_auth_token, validate_refresh_token, add_rating);

module.exports = router;