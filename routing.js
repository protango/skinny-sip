const express = require('express');
const escape = require('escape-html');
const request = require('request-promise-native');
const jwt = require('jsonwebtoken');
const sql = require('mssql');

const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/config/apiKeys.json')).apiKeys;

const router = express.Router();

/**
 * Refreshes a users auth session, if there is one. Also returns the username of the current user, or null if no one is logged in
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @returns {string} The currently logged in username
 */
function refreshAuth(req, res) {
  let auth = req.cookies.auth;
  if (auth) {
    try {
      let payload = jwt.verify(auth, apiKeys.jwtSecret);
      res.cookie('auth', jwt.sign({ sub: payload.sub }, apiKeys.jwtSecret, { expiresIn: '1h' }), { maxAge: 3600000 });
      return payload.sub;
    } catch {
      res.clearCookie("auth");
      return null;
    }
  } else {
    return null;
  }
}

// index route
router.get('/', (req, res) => {
  refreshAuth(req, res);
  res.render("index", {active: "Search"});
});

// search route
router.get('/Search', (req, res) => {
  refreshAuth(req, res);
  res.render("search", {active: "Search"});
});

// about route
router.get('/About', (req, res) => {
  refreshAuth(req, res);
  res.render("about", {active: "About"});
});

// drink route
router.get('/Drink', async (req, res) => {
  refreshAuth(req, res);
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
  refreshAuth(req, res);
  res.render("error", {error: escape(req.query.error), ...await require("./controllers/server/error")()});
});

// substitute route
router.get('/Substitute', (req, res) => {
  refreshAuth(req, res);
  try {
    res.render("substitute", req.query);
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});

// Random route
router.get('/Random', async (req, res) => {
  refreshAuth(req, res);
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
  refreshAuth(req, res);
  try {
    res.render("ingredient", await require("./controllers/server/ingredient")(req.query));
  } catch (e) {
    console.log(e);
    res.redirect(302, '/Error?error='+e.message);
  }
});
// Login route
router.get('/Login', async (req, res) => {
  refreshAuth(req, res);
  res.render("login", {active: "Login", ...req.query});
});


// api routes
require("./api/search")(router);
require("./api/random")(router);
require("./api/substitute")(router);
require("./api/login")(router);
require("./api/comment")(router);
require("./api/register")(router);

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