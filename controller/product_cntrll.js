const axios = require('axios');
const { Op } = require('sequelize');
const util = require('util');

// Utils
const handleCaughtError = require("../utils/error_handler");
const response_handler = require("../utils/response_handler");

// Models
const product_model = require("../models/product_model");
const category_model = require("../models/category_model");
const product_image_model = require("../models/product_image_model");
const rating_model = require("../models/product_rating_model");
const user_model = require("../models/user_model");


/**
 * 
 * ENDPOINT : /api/user/v1/product-service/add_category
 * Table used : category_model
 * 
 */

const create_category = async (req, res) => {
  try {
    const { name, brand } = req.body;
    if (!name || !brand) return response_handler.send_error_response(res, "name and brand are required.", 400);
    const check_brand = await category_model.findOne({ where: { name: name, brand: brand }, raw: true });
    if (check_brand) return response_handler.send_error_response(res, "Brand Already added.", 403);

    const category = await category_model.create({
      name: name,
      brand: brand,
      is_active: true
    });
    return response_handler.send_success_response(res, "category added successfully.", 201);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/get_all_category
 * Table used : category_model
 * 
 */
const get_all_category = async (req, res) => {
  try {
    const all_category = await category_model.findAll({ where: { is_active: 1 }, attributes: ['category_id', 'name', 'brand'], raw: true });

    const groupedMap = new Map();

    all_category.forEach(item => {
      if (!groupedMap.has(item.name)) {
        groupedMap.set(item.name, []);
      }
      groupedMap.get(item.name).push({
        category_id: item.category_id,
        brand: item.brand,
      });
    });
    // Convert Map to plain object if needed
    const groupedObj = Object.fromEntries(groupedMap.entries());
    return response_handler.send_success_response(res, groupedObj, 200);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/get_category?name={}
 * Table used : category_model
 * 
 */

const get_category_brand = async (req, res) => {
  try {
    const { name } = req.query;
    const all_brand = await category_model.findAll({ where: { name: name, is_active: 1 }, attributes: ['category_id', 'brand'], raw: true });
    if (all_brand.length > 0) {
      return response_handler.send_success_response(res, { name, all_brand }, 200);
    }
    return response_handler.send_error_response(res, "category not available.", 404);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/add_product
 * Table used : category_model
 * 
 */

const create_product = async (req, res) => {
  const userId = req.id;
  try {
    const { name, description, price, stock } = req.body;
    if (!name || !description || !price || !stock) return response_handler.send_error_response(res, "name,description,price,stock all required.", 400);

    const find_name = await category_model.findOne({ where: { brand: name, is_active: 1 }, raw: true });
    if (find_name != null) {
      await product_model.create({
        name: name,
        description: description,
        price: price,
        stock: stock,
        category_id: find_name.category_id,
        created_by: userId,
        is_active: true,
      });
      return response_handler.send_success_response(res, "product added successfully.", 201);
    }
    return response_handler.send_error_response(res, "product not available in category database.", 401);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/get_product_created_by?product_id={}
 * Table used : category_model
 * 
 */

const get_product_created_admin = async (req, res) => {
  try {
    const api_key = req.header('x-api-key');
    const auth_token = req.header('x-auth-token');
    const refresh_token = req.header('x-refresh-token');
    const { product_id } = req.body;
    const check_product = await product_model.findOne(
      {
        where: { product_id: product_id },
        attributes: ['product_id', 'name', 'stock', 'created_by'],
        raw: true
      }
    );
    if (check_product.stock > 0) {
      const userId = check_product.created_by;
      let axiosConfig = {
        method: 'post',
        url: `${process.env.AUTH_SERVICE_HOST}/api/user/${process.env.AUTH_SERVICE_VERSION}/auth-service/get-user`,
        headers: {
          'x-api-key': api_key,
          'x-auth-token': auth_token,
          'x-refresh-token': refresh_token
        },
        data: { userId }
      };
      const response = await axios(axiosConfig);
      const product = {
        ...check_product,
        created_by: response.data.data,
      };
      return response_handler.send_success_response(res, product, 200);
    }
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/get_all_product
 * Table used : product_model
 * 
 */

const get_all_product = async (req, res) => {
  try {
    const { product_name, minPrice, maxPrice, price_sort, page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Parse and apply price filters
    let priceFilter = null;

    if (!isNaN(parseFloat(minPrice)) && !isNaN(parseFloat(maxPrice))) {
      priceFilter = {
        [Op.between]: [parseFloat(minPrice), parseFloat(maxPrice)],
      };
    } else if (!isNaN(parseFloat(minPrice))) {
      priceFilter = { [Op.gte]: parseFloat(minPrice) };
    } else if (!isNaN(parseFloat(maxPrice))) {
      priceFilter = { [Op.lte]: parseFloat(maxPrice) };
    }

    // Fetch matching category IDs by product_name (used for search)
    const categoryResult = await category_model.findAll({
      where: {
        name: { [Op.like]: `%${product_name}%` },
        is_active: true
      },
      attributes: ['category_id'],
      raw: true
    });
    const categoryIds = categoryResult.map((cat) => cat.category_id);

    // Construct where condition for product query
    const productWhereCondition = {
      is_active: true,
      ...(product_name && {
        [Op.or]: [
          { name: { [Op.like]: `%${product_name}%` } },
          { description: { [Op.like]: `%${product_name}%` } }
        ]
      }),
      ...(categoryIds.length > 0 && { category_id: categoryIds }),
      ...(priceFilter && { price: priceFilter })
    };


    let orderClause = [];
    if (price_sort === 'asc' || price_sort === 'desc') {
      orderClause.push(['price', price_sort]);
    }

    // Fetch paginated and filtered product list
    const result = await product_model.findAndCountAll({
      where: productWhereCondition,
      order: orderClause,
      offset,
      limit: parseInt(limit),
      raw: true
    });

    const count = result.count;
    const rows = result.rows;

    // Format product output
    const products = rows.map(({ product_id, name, description, price }) => ({
      product_id,
      name,
      description,
      price
    }));

    // Final API response
    return response_handler.send_success_response(res, {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalProducts: count,
      products
    }, 200);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/get_product
 * Table used : product_model
 * 
 */

const get_product = async (req, res) => {
  const api_key = req.header('x-api-key');
  const auth_token = req.header('x-auth-token');
  const refresh_token = req.header('x-refresh-token');
  try {
    const { product_id } = req.query;
    const product = await product_model.findOne({ where: { product_id: product_id, is_active: 1 }, raw: true });
    if (!product) return response_handler.send_error_response(res, "product not found.", 404);
    const category = await category_model.findOne({ where: { category_id: product.category_id }, raw: true });
    const category_data = {
      category_id: category.category_id,
      name: category.name
    };
    const rating = await rating_model.findAll({ where: { product_id: product_id }, raw: true });

    const rat_num = rating.map((num) => parseFloat(num.rating_value));
    const total = rat_num.reduce((sum, val) => sum + val, 0);
    const average = rat_num.length > 0 ? parseFloat((total / rat_num.length).toFixed(1)) : 0;

    if (rat_num.length > 0) {
      const userId = rating.map((id) => id.user_id);
      let axiosConfig = {
        method: 'post',
        url: `${process.env.AUTH_SERVICE_HOST}/api/user/${process.env.AUTH_SERVICE_VERSION}/auth-service/get-user`,
        headers: {
          'x-api-key': api_key,
          'x-auth-token': auth_token,
          'x-refresh-token': refresh_token
        },
        data: { userId }
      };
      const response = await axios(axiosConfig);
      const userData = response.data.data;

      const myMap = new Map();
      rating.forEach((data) => {
        myMap.set(data.user_id, {
          rating: data.rating_value,
          description: data.description
        });
      });


      var user_rating = [];
      userData.forEach((user) => {
        if (myMap.has(user.user_id)) {
          const ratingData = myMap.get(user.user_id);
          user_rating.push({
            name: user.name,
            rating: ratingData.rating,
            description: ratingData.description
          });
        }
      });
    }

    const single_product = {
      product_id: product.product_id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      stock: product.stock,
      avg_rating: average,
      category: category_data,
      all_user_rating: user_rating
    };

    return response_handler.send_success_response(res, single_product, 200);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/add_rating
 * Table used : product_model
 * 
 */

const add_rating = async (req, res) => {
  const userId = req.id;
  const api_key = req.header('x-api-key');
  const auth_token = req.header('x-auth-token');
  const refresh_token = req.header('x-refresh-token');
  let axiosConfig = {
    method: 'post',
    url: `${process.env.AUTH_SERVICE_HOST}/api/user/${process.env.AUTH_SERVICE_VERSION}/auth-service/get-user`,
    headers: {
      'x-api-key': api_key,
      'x-auth-token': auth_token,
      'x-refresh-token': refresh_token
    },
    data: { userId }
  };
  try {
    const { rating, description, product_id } = req.body;
    const product_rate = await rating_model.findOne({ where: { user_id: req.id, product_id: product_id }, raw: true });
    if (product_rate) return response_handler.send_error_response(res, "you have already rated this product!.", 400);
    const response = await axios(axiosConfig);
    if (response.data.data.statusCode === '404') return response_handler.send_error_response(res, "unauthorized user!.", 403);
    const roundedRating = Math.round(rating * 10) / 10;
    const rate = await rating_model.create({
      rating_value: roundedRating,
      description: description,
      user_id: response.data.data[0].user_id,
      product_id: product_id
    });
    return response_handler.send_success_response(res, rate, 201);
  }
  catch (err) {
    console.log(err);
    return handleCaughtError(err, res);
  }
};

/**
 * 
 * ENDPOINT : /api/user/v1/product-service/update_product
 * Table used : product_model
 * 
 */

const update_product = async (req, res) => {
  try {
    const { product_id, stock, price, is_active } = req.body;
    const product = await product_model.update(
      { stock: stock, price: price, is_active: is_active },
      {
        where: { product_id: product_id }
      }
    );
    return response_handler.send_success_response(res, "product updated successfully!.", 200);
  }
  catch (err) {
    return handleCaughtError(err, res);
  }
};

module.exports = { create_category, get_all_category, get_category_brand, create_product, get_product_created_admin, get_all_product, get_product, add_rating, update_product };