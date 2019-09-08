const express = require('express');

const router = express.Router();

// index route
router.get('/', (req, res) => {
  res.sendFile("views/index.html", { root: __dirname });
});
// search route
router.get('/Search', (req, res) => {
  res.sendFile("views/search.html", { root: __dirname });
});

// api routes
require("./api/search")(router);
require("./api/random")(router);

// Expose images
router.use('/img', express.static(__dirname + '/img/'));

// Expose js controllers
router.use('/controllers', express.static(__dirname + '/controllers/'));

//Expose css
router.use('/css', express.static(__dirname + '/css/'));

// Expose client side modules
router.use('/inc/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
router.use('/inc/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
router.use('/inc/font-awesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free'));

module.exports = router;