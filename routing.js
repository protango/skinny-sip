const express = require('express');
const escape = require('escape-html');
const request = require('request-promise-native');

const router = express.Router();

// index route
router.get('/', (req, res) => {
  res.render("index", {active: "Search"});
});

// search route
router.get('/Search', (req, res) => {
  res.render("search", {active: "Search"});
});

// about route
router.get('/About', (req, res) => {
  res.render("about", {active: "About"});
});

// drink route
router.get('/Drink', async (req, res) => {
  try {
    res.render("drink", await require("./controllers/server/drink")(req.query));
  } catch(e) {
    console.log(e);
    if (e.needsSubstitute) {
      res.redirect(302, '/Substitute?ingredient='+e.needsSubstitute+'&drinkId='+req.query.id);
    } else {
      res.redirect(302, '/Error?error='+e.message);
    }
  }
});

// error route
router.get('/Error', async (req, res) => {
  res.render("error", {error: escape(req.query.error), ...await require("./controllers/server/error")()});
});

// substitute route
router.get('/Substitute', (req, res) => {
  try {
    res.render("substitute", req.query);
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});

// Random route
router.get('/Random', async (req, res) => {
  try {
    let result = await request({uri: 'https://www.thecocktaildb.com/api/json/v1/1/random.php', json: true});
    res.redirect(302, '/Drink?id='+result.drinks[0].idDrink);
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});
// Ingredient route
router.get('/Ingredient', async (req, res) => {
  try {
    res.render("ingredient", await require("./controllers/server/ingredient")(req.query));
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});
// Login route
router.get('/Login', async (req, res) => {
  res.render("login", {active: "Login", ...req.query});
});


// api routes
require("./api/search")(router);
require("./api/random")(router);
require("./api/substitute")(router);
require("./api/login")(router);

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