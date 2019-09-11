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
// drink route
router.get('/Drink', async (req, res) => {
  try {
    res.render("drink", await require("./controllers/server/drink")(req.query));
  } catch(e) {
    res.redirect(301, '/Error?error='+e.message);
  }
});
// error route
router.get('/Error', async (req, res) => {
  res.render("error", {error: req.query.error, ...await require("./controllers/server/error")()});
});


// api routes
require("./api/search")(router);
require("./api/random")(router);

// Expose images
router.use('/img', express.static(__dirname + '/img/'));

// Expose js controllers
router.use('/controllers', express.static(__dirname + '/controllers/client/'));

//Expose css
router.use('/css', express.static(__dirname + '/css/'));

// Expose client side modules
router.use('/inc/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
router.use('/inc/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
router.use('/inc/font-awesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free'));

module.exports = router;