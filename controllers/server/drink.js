const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

async function drinkServerController(query) {
    let id = Number(query.id);
    if (isNaN(Number(id))) throw new Error("Invalid Id");

    var drink = await request({
        uri: 'https://www.thecocktaildb.com/api/json/v1/'+apiKeys.cocktailDB+'/lookup.php',
        qs: {i: id },
        json: true
    });

    if (!drink.drinks) throw new Error("Problem with the Cocktail DB API");
    if (!drink.drinks.length) throw new Error("Invalid Id");
    drink = drink.drinks[0];

    var recipe = [];
    for (let i = 1; i<=15; i++) {
        let ing = {
            ingredient: drink["strIngredient"+i] ? drink["strIngredient"+i].trim() : null,
            measure: drink["strMeasure"+i] ? drink["strMeasure"+i].trim() : null
        };
        if (ing.ingredient) {
            if (!ing.measure) ing.measure = "1 Serving";
            recipe.push(ing);
        }
    }

    result = {
        name: drink.strDrink,
        id: drink.idDrink,
        desc: drink.strCategory,
        img: drink.strDrinkThumb,
        tags: drink.strTags ? drink.strTags.split(",").map(x=>x.replace(/([a-z])([A-Z])/g, "$1 $2")) : [],
        glass: drink.strGlass,
        method: drink.strInstructions,
        nutrition: await require("../../api/internal/nutrition")(recipe, drink.strDrink)
    }

    return result;
}

module.exports = drinkServerController;