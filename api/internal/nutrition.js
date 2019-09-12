const request = require('request-promise-native');
const fs = require('fs');
const microNutrients = JSON.parse(fs.readFileSync(__dirname + '/../../micronutrients.json')).microNutrients;
const unknownIngredientsMap = JSON.parse(fs.readFileSync(__dirname + '/../../unknownIngredientsMap.json')).unknownIngredientsMap;

async function internalNutritionApi(recipe, drinkName) {
    let result = {microNutrients: microNutrients};
    fixUnknownIngredients(recipe);
    fixUnknownMeasures(recipe);
    let nlpRecipe = recipe.map(x=>{
        let result = x.measure;
        if (x.unit) result+= " " + x.unit;
        result += " " + x.ingredient;
        return result;
    }).join("\n");

    let headers = {
        "x-app-id": "a73a6a46",
        "x-app-key": "468dbab1e189d87d17155c5afa1ad6e3"
    }
    let response = await request({
        method: 'POST',
        uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
        body: {
            query: nlpRecipe,
            line_delimited: true,
            aggregate: drinkName || "Drink"
        },
        json: true,
        headers: headers
    });

    if (response.errors && response.errors.length) 
        throw new Error("Failed to parse ingredient: \""+response.errors[0].original_text+"\"\n" + (response.errors[0].warning || ""));
    result.aggregate = response.foods[0];

    response = await request({
        method: 'POST',
        uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
        body: {
            query: nlpRecipe,
            line_delimited: true
        },
        json: true,
        headers: headers
    });
    if (response.errors && response.errors.length) 
        throw new Error("Failed to parse ingredient: \""+response.errors[0].original_text+"\"\n" + (response.errors[0].warning || ""));
    result.ingredients = response.foods;

    result.aggregate.nf_energy = Math.round(result.aggregate.nf_calories * 4.184);
    addMetricMeasure(result.aggregate);

    for (let i = 0; i<result.ingredients.length; i++) {
        let ing = result.ingredients[i];
        let og_ing = recipe[i];
        addMetricMeasure(ing);
        ing.nf_energy = Math.round(ing.nf_calories * 4.184);
        if (og_ing && og_ing.originalIngredient) {
            ing.food_name = og_ing.originalIngredient;
            ing.forceImageLookup = true;
        }
        await fixBrokenImages(ing);
    }
    for (let ing of result.ingredients){

    }

    return result;
}

module.exports = internalNutritionApi;


function addMetricMeasure(foodItem) {
    switch(foodItem.serving_unit) {
        case "oz":
        case "fl oz":
            foodItem.serving_qty_metric = Math.round(foodItem.serving_qty * 29.5735);
            foodItem.serving_unit_metric = "mL";
          break;
        case "shots":
        case "shot":
            foodItem.serving_qty_metric = Math.round(foodItem.serving_qty * 42);
            foodItem.serving_unit_metric = "mL";
          break;
    }
}

async function fixBrokenImages(foodItem) {
    if (!foodItem.forceImageLookup && foodItem.photo.thumb !== "https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png") return;
    let cocktailDBURL = "https://www.thecocktaildb.com/images/ingredients/"+foodItem.food_name+"-Small.png"
    let success = true;
    try {
        await request(cocktailDBURL);
    } catch {
        success = false;
    }
    if (success) {
        return foodItem.photo.thumb = cocktailDBURL;
    }
    switch(foodItem.food_name) {
        case "bourbon":
            foodItem.photo.thumb = "/img/bourbon.jpg";
        break;
        case "bitters":
            foodItem.photo.thumb = "/img/bitters.jpg";
        break;
        case "grenadine":
            foodItem.photo.thumb = "/img/grenadine.jpg";
        break;
        case "rum":
            foodItem.photo.thumb = "/img/rum.png";
        break;
        case "malibu":
        case "malibu rum":
            foodItem.photo.thumb = "/img/malibu.jpg";
        break;
    }
}

function fixUnknownIngredients(recipe) {
    for (let line of recipe) {
        let ing = line.ingredient.toLowerCase();
        for (let mapping of unknownIngredientsMap) {
            if (ing.includes(mapping.ogContains.toLowerCase())) {
                line.ingredient = mapping.replacement;
                if (!mapping.permanent)
                    line.originalIngredient = ing;
                break;
            }
        }
    }
}

function fixUnknownMeasures(recipe) {
    for (let line of recipe) {
        line.originalMeasure = line.measure;
        let measure = line.measure.toLowerCase().trim();
        let ing = line.ingredient.toLowerCase().trim();
        if (measure === "juice of 1/2" && (ing === "lemon" || ing === "lime")) {
            line.measure = "15 mL";
            line.ingredient = ing + " juice";
        } else if (measure.endsWith("cl")) {
            let numberVal = Number(measure.substring(0, measure.length - 2));
            if (!isNaN(numberVal)) {
                line.measure = (numberVal * 10) + " mL";
            }
        }
    }
}
