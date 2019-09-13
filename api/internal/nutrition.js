const fs = require('fs');
const cachedNutritionix = require('./cachedNutritionix');
const ingredientMap = require('./ingredientMap');
const microNutrients = JSON.parse(fs.readFileSync(__dirname + '/../../config/micronutrients.json')).microNutrients;

async function internalNutritionApi(recipe, drinkName) {
    let result = {microNutrients: microNutrients}; // we send micronutrients to the scope for rendering
    fixUnknownMeasures(recipe); // fix badly formatted measures in cocktail DB
    fixUnknownIngredients(recipe); // re-map known bad ingredients to their known substitute

    // get nutritionix response
    response = await cachedNutritionix(recipe);

    result.ingredients = response.foods;
    // merge the nutrition data for each ingredient into one aggregate object
    result.aggregate = aggregateNutrition(response.foods, drinkName || "Drink");
    // calculate energy in kj
    result.aggregate.nf_energy = Math.round(result.aggregate.nf_calories * 4.184);
    // add metric measurements
    addMetricMeasure(result.aggregate);

    // process each sub ingredient
    for (let i = 0; i<result.ingredients.length; i++) {
        let ing = result.ingredients[i];
        let og_ing = recipe[i];
        addMetricMeasure(ing); // add metric measurements
        ing.nf_energy = Math.round(ing.nf_calories * 4.184);
        if (og_ing) { // re-map ingredient back to it's original name
            ing.food_name = og_ing.originalIngredient || og_ing.ingredient;
            if (og_ing.originalIngredient)
                ing.forceImageLookup = true;
        }
        await fixBrokenImages(ing); // fix broken images
    }

    return result;
}

module.exports = internalNutritionApi;

// adds metric measurements where possible
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
// fixes broken images where possible
async function fixBrokenImages(foodItem) {
    if (!foodItem.forceImageLookup && foodItem.photo.thumb !== "https://d2eawub7utcl6.cloudfront.net/images/nix-apple-grey.png") return;
    let cocktailDBURL = "https://www.thecocktaildb.com/images/ingredients/"+foodItem.food_name+"-Small.png"
    return foodItem.photo.thumb = cocktailDBURL;
}
// remaps unknown ingredients to their substitute values
function fixUnknownIngredients(recipe) {
    for (let line of recipe) {
        let og_ing = line.ingredient.toLowerCase();
        line.ingredient = ingredientMap.map(og_ing);
        if (line.ingredient !== og_ing) {
            line.originalIngredient = og_ing;
        }
    }
}
// fixes badly formatted measurements
function fixUnknownMeasures(recipe) {
    for (let line of recipe) {
        line.originalMeasure = line.measure;
        let measure = line.measure.toLowerCase().trim();
        let ing = line.ingredient.toLowerCase().trim();
        let matches;
        // handle situation where part of the ingredient name is in the measurement field
        if (matches = measure.match(/^\s*(\d+|(?:\d+ )?\d+\/\d+|\d+\.\d+)\s+(ml|oz|shots?|fl oz|cups?|cl|bottles?|gal|lb|g|dl)\s+(.+)$/i)) {
            ing = line.ingredient = matches[3] + " " + ing;
            measure = line.measure = matches[1] + " " + matches[2];
        }
        if (matches = measure.match(/juice of (\d+)\/(\d+)/)) {
            let qty = Math.round(Number(matches[1]) / Number(matches[2]) * 30);
            line.measure = qty + " mL";
            line.ingredient = ing + " juice";
        } else if (measure.endsWith(" cl")) {
            let numberVal = Number(measure.substring(0, measure.length - 2));
            if (!isNaN(numberVal)) {
                line.measure = (numberVal * 10) + " mL";
            }
        } else if (measure.endsWith(" dl")) {
            let numberVal = Number(measure.substring(0, measure.length - 2));
            if (!isNaN(numberVal)) {
                line.measure = (numberVal * 100) + " mL";
            }
        }
    }
}

// merge individual nutrition objects into one
function aggregateNutrition(indivResults, newName) {
    if (!indivResults || !indivResults.length) return {};
    let result = Object.assign({}, indivResults[0]);
    result.food_name = newName;
    result.serving_qty = 1;
    result.serving_unit = "serving";
    let nfKeys = Object.keys(result).filter(x=>x.startsWith("nf_")); // get a list of keys that correspond to nutrition values
    for (let i = 1; i<indivResults.length; i++) {
        let foodItem = indivResults[i];
        result.serving_weight_grams += foodItem.serving_weight_grams;
        for (let key of nfKeys)
            result[key] += foodItem[key];
        for (let microN of foodItem.full_nutrients) { // process micronutrients
            let matchingResultVal = result.full_nutrients.find(x=>x.attr_id===microN.attr_id);
            if (matchingResultVal) {
                matchingResultVal.value += microN.value;
            } else {
                result.full_nutrients.push(microN);
            }
        }
    }
    // Limit serving size to 500g
    if (result.serving_weight_grams > 500) {
        let divisor = result.serving_weight_grams / 500;
        result.serving_qty = Math.round(divisor * 10) / 10;
        result.serving_weight_grams = 500;
        for (let key of nfKeys)
            result[key] /= divisor;
        for (let microN of result.full_nutrients) 
            microN.value /= divisor;
    }
    result.serving_weight_grams = Math.round(result.serving_weight_grams*100) / 100;
    return result;
}