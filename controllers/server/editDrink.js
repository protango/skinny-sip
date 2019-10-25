const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const sql = require('mssql');

/**
 * Builds an object for use by the edit drinks page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function editDrinkServerController(query) {
    // Get normal nutrition object from drinksController
    let drinkObj = await require("./drink")(query);
    return drinkObj;
}

module.exports = editDrinkServerController;