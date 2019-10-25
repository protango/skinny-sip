const express = require('express');
const escape = require('escape-html');
const request = require('request-promise-native');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const userManager = require('./api/internal/userManager');

const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/config/apiKeys.json')).apiKeys;

const router = express.Router();

// index route
router.get('/', (req, res) => {
  userManager.refreshAuth(req, res);
  res.render("index", {active: "Search"});
});

// search route
router.get('/Search', (req, res) => {
  userManager.refreshAuth(req, res);
  res.render("search", {active: "Search"});
});

// about route
router.get('/About', (req, res) => {
  userManager.refreshAuth(req, res);
  res.render("about", {active: "About"});
});

// drink route
router.get('/Drink', async (req, res) => {
  userManager.refreshAuth(req, res);
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

// edit route
router.get('/Edit', async (req, res) => {
  let username = userManager.refreshAuth(req, res);
  try {
    if (!username) throw new Error("Please log in to access this page");
    res.render("editDrink", await require("./controllers/server/editDrink")(req.query));
  } catch(e) {
    console.log(e);
    res.redirect('/Error?error='+e.message);
  }
});

// error route
router.get('/Error', async (req, res) => {
  userManager.refreshAuth(req, res);
  res.render("error", {error: escape(req.query.error), ...await require("./controllers/server/error")()});
});

// substitute route
router.get('/Substitute', (req, res) => {
  userManager.refreshAuth(req, res);
  try {
    res.render("substitute", req.query);
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});

// Random route
router.get('/Random', async (req, res) => {
  userManager.refreshAuth(req, res);
  try {
    let result = await sql.query`SELECT TOP (1) r.id FROM dbo.recipes r ORDER BY newid()`;
    res.redirect(302, '/Drink?id='+result.recordset[0].id);
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});
// Ingredient route
router.get('/Ingredient', async (req, res) => {
  userManager.refreshAuth(req, res);
  try {
    res.render("ingredient", await require("./controllers/server/ingredient")(req.query));
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});
// Login route
router.get('/Login', async (req, res) => {
  userManager.refreshAuth(req, res);
  res.render("login", {active: "Login", ...req.query});
});


// api routes
require("./api/search")(router);
require("./api/random")(router);
require("./api/substitute")(router);
require("./api/login")(router);
require("./api/comment")(router);
require("./api/register")(router);
require("./api/instantEditing")(router);

// Expose images
router.use('/img', express.static(__dirname + '/img/'));

// Expose js controllers
router.use('/controllers', express.static(__dirname + '/controllers/client/'));

//Expose css
router.use('/css', express.static(__dirname + '/css/'));

// Expose client side modules
router.use('/inc/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
router.use('/inc/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));
router.use('/inc/js-cookie', express.static(__dirname + '/node_modules/js-cookie/src/'));
router.use('/inc/font-awesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free'));

module.exports = router;