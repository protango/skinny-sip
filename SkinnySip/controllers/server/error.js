const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

/**
 * Builds an object for use by the error page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function errorServerController() {
    result = {
        cocktaildbOnline: false,
        nutritionixOnline: false
    };
    
    try {
        var body = await request({
            uri: 'https://www.thecocktaildb.com/api/json/v1/'+apiKeys.cocktailDB+'/search.php',
            qs: {s: "margarita" },
            json: true
        });
    } catch {}
    if (body && body.drinks && body.drinks.length > 0) result.cocktaildbOnline = true;

    try {
        body = await request({
            uri: 'https://trackapi.nutritionix.com/v2/search/instant',
            qs: {query: "vodka" },
            json: true,
            headers: apiKeys.nutritionix
        });
    } catch {}

    if (body && body.common && body.common.length > 0) result.nutritionixOnline = true;

    return result;
}

module.exports = errorServerController;