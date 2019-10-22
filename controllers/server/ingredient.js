const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

/**
 * Builds an object for use by the ingredient page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function ingredientServerController(query) {
    if (!query.ingredient) throw new Error("Invalid ingredient");

    let ingName = query.ingredient;
    let ingSubName = null;
    let ingDescription = null;

    var ingsResponse = await request({
        uri: 'https://www.thecocktaildb.com/api/json/v1/'+apiKeys.cocktailDB+'/search.php',
        qs: {i: query.ingredient },
        json: true
    });

    if (ingsResponse && ingsResponse.ingredients && ingsResponse.ingredients.length) {
        var ingResponse = await request({
            uri: 'https://www.thecocktaildb.com/api/json/v1/'+apiKeys.cocktailDB+'/lookup.php',
            qs: {iid: ingsResponse.ingredients[0].idIngredient },
            json: true
        });
        if (ingResponse && ingResponse.ingredients && ingResponse.ingredients.length) {
            let ing = ingResponse.ingredients[0];
            ingName = ing.strIngredient;
            ingDescription = ing.strDescription;
            ingSubName = ing.strType;
        }
    }

    let drinks = [];
    var drinksResponse = await request({
        uri: 'https://www.thecocktaildb.com/api/json/v1/'+apiKeys.cocktailDB+'/filter.php',
        qs: {i: ingName },
        json: true
    });
    if (drinksResponse&&drinksResponse.drinks&&drinksResponse.drinks.length)
        drinks = drinksResponse.drinks

    return {
        ingredient: ingName,
        subName: ingSubName,
        desc: ingDescription,
        drinks: drinks
    };
}

module.exports = ingredientServerController;