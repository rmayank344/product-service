const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
require("./config/sql_conn");


// Redis Call
// connectRedis();

app.use(express.json({ 'limit': '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Add Health Check Route for Default Target Group (/)
app.get('/', (req, res) => {
  res.status(200).send('Default Route Healthy');
});

// Add Health Check Route for Target Group admin-role (/api/admin_role/health)
app.get('/api/admin/v1/product-service', (req, res) => {
  res.status(200).send('Admin Role Service Healthy');
});

// Add Health Check Route for Target Group user-role (/api/user_role/health)
app.get('/api/user/v1/product-service', (req, res) => {
  res.status(200).send('product-Service Role Healthy');
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "x-auth-token",
    "x-refresh-token",
    "admin-auth-token",
    "admin-refresh-token",
    "cust-x-api-key"
  ]
}));

//routes
app.use("/api/user/v1/product-service", require("./routes/user_product_routes"));
app.use("/api/admin/v1/product-service", require("./routes/admin_product_routes"));


app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
