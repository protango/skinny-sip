const request = require('request-promise-native');

async function drinkServerController(query) {
    let id = Number(query.id);

    if (isNaN(Number(number))) return res.send(result);

    var drink = await request({
        uri: 'https://www.thecocktaildb.com/api/json/v1/1/lookup.php',
        qs: {i: id },
        json: true
    });

    var recipe = [];
    for (let i = 1; i<=15; i++) {
        let ing = {
            ingredient: drink["strIngredient"+i].trim(),
            measure: drink["strMeasure"+i].trim()
        };
        recipe.push({
            ingredient: drink["strIngredient"+i],
            measure: drink["strMeasure"+i]
        });
    }

    result = {
        name: drink.strDrink,
        id: drink.idDrink,
        desc: drink.strCategory,
        img: drink.strDrinkThumb,
        tags: drink.strTags ? drink.strTags.split(",").map(x=>x.replace(/([a-z])([A-Z])/g, "$1 $2")) : [],
        glass: drink.strGlass,
        nutrition: await require("./internalNutritionApi")(recipe, drink.strDrink)
    }

    return result;
}

module.exports = drinkServerController;