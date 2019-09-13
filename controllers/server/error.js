const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

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
            method: 'POST',
            uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
            body: {
                query: "5g Sugar"
            },
            json: true,
            headers: apiKeys.nutritionix
        });
    } catch {}

    if (body && body.foods && body.foods.length > 0) result.nutritionixOnline = true;

    return result;
}

module.exports = errorServerController;