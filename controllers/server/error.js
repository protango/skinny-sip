const request = require('request-promise-native');

async function errorServerController() {
    result = {
        cocktaildbOnline: false,
        nutritionixOnline: false
    };
    
    var body = await request({
        uri: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
        qs: {s: "margarita" },
        json: true
    });
    if (body && body.drinks && body.drinks.length > 0) result.cocktaildbOnline = true;

    let headers = {
        "x-app-id": "a73a6a46",
        "x-app-key": "468dbab1e189d87d17155c5afa1ad6e3"
    };
    body = await request({
        method: 'POST',
        uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
        body: {
            query: "5g Sugar"
        },
        json: true,
        headers: headers
    });

    if (body && body.foods && body.foods.length > 0) result.nutritionixOnline = true;

    return result;
}

module.exports = errorServerController;