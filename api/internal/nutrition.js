const request = require('request-promise-native');

async function internalNutritionApi(recipe, drinkName) {
    let result = {};

    let nlpRecipe = recipe.map(x=>{
        let result = x.measure;
        if (x.unit) result+= " " + x.unit;
        result += " " + x.ingredient;
    }).join("\n");

    let headers = {
        "x-app-id": "a73a6a46",
        "x-app-key": "468dbab1e189d87d17155c5afa1ad6e3"
    }

    result.aggregate = (await request({
        method: 'POST',
        uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
        body: {
            query: nlpRecipe,
            line_delimited: true,
            aggregate: drinkName || "Drink"
        },
        json: true,
        headers: headers
    })).foods[0];
    result.ingredients = (await request({
        method: 'POST',
        uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
        body: {
            query: nlpRecipe,
            line_delimited: true
        },
        json: true,
        headers: headers
    })).foods;
    return result;
}

module.exports = internalNutritionApi;