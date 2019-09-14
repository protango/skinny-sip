const fs = require('fs');
const crypto = require('crypto');
const request = require('request-promise-native');
const cloneDeep = require('clone-deep');
const ingredientMap = require('./ingredientMap');

const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const cache = JSON.parse(fs.readFileSync(__dirname + '/../../config/nutritionixCache.json'));

const maxCacheEntries = 1000;

/**
 * Returns the nutrition information for a given recipe object.
 * Will use cache where possible.
 * @param {recipe} recipe The recipe
 */
async function cachedNutritionix(recipe) {
    let unknownLines = [];
    let simResponse = {foods: []};
    recipe = cloneDeep(recipe); // clone to not pollute calling scope
    for (let line of recipe) {
        let matches = null, qty = null, unit = null, cacheKey = null;
        if (matches = line.measure.match(/(\d+ )?(\d+)\/(\d+)\s+([^\d]+)\s*$/i)) {
            qty = (Number(matches[1]) || 0) + (Number(matches[2]) / Number(matches[3]));
            unit = matches[4];
        } else if (matches = line.measure.match(/(\d+(?:\.\d+)?)\s+([^\d]+)\s*$/i)) {
            qty = Number(matches[1]);
            unit = matches[2];
        } 
        if (unit === "cups" || unit === "shots") unit = unit.substring(0, unit.length - 1);
        if (unit === "fl oz") {unit = "oz"; qty /= 1.040843;}
        if (unit === "shot") {unit = "oz"; qty *= 1.5;}

        if (qty && unit) cacheKey = JSON.stringify({u: unit, i: line.ingredient.toLowerCase()});
        else cacheKey = JSON.stringify({m: line.measure, i: line.ingredient.toLowerCase()});

        let cacheMatch = cache[cacheKey];
        if (cacheMatch) {
            cacheMatch = cloneDeep(cacheMatch); // clone to not pollute cache
            if (qty && unit) {
                let scale = 1/cacheMatch.serving_qty*qty;
                cacheMatch = scaleNutritionObj(cacheMatch, scale);
            }
            simResponse.foods.push(cacheMatch);
        } else {
            unknownLines.push(Object.assign({cacheKey: cacheKey, lineNo: recipe.indexOf(line)}, line));
        }
    }
    if (unknownLines.length) {
        let nlpRecipe = unknownLines.map(x=>x.measure+" "+x.ingredient).join("\n");
        // get nutritionix response
        let response = {};
        try {
            response = await request({
                method: 'POST',
                uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
                body: {
                    query: nlpRecipe,
                    line_delimited: true
                },
                json: true,
                headers: apiKeys.nutritionix
            });
        } catch (e) {
            if (e.statusCode===404 && e.error && e.error.errors) {
                response.errors = e.error.errors;
            } else throw e;
        }
        if (response.errors && response.errors.length) {
            handleNutritionixError(response, unknownLines);
        } else {
            let cacheKeys = Object.keys(cache);
            for (let i = 0; i<response.foods.length; i++) {
                // write to simulated response
                simResponse.foods.splice(unknownLines[i].lineNo, 0, response.foods[i]);
                // write to memory cache if there's room
                if (cacheKeys.length < maxCacheEntries);
                    cache[unknownLines[i].cacheKey] = response.foods[i];
            }
            // save cache to disk if there's room
            if (cacheKeys.length < maxCacheEntries);
                fs.writeFileSync(__dirname + '/../../config/nutritionixCache.json', JSON.stringify(cache), function(err) {
                    if(err) throw err;
                });
        }
    } else {
        console.log("Just served a 100% cached request!")
    }
    return simResponse;
}

/**
 * Multiplies all nutirtion values in a nutrition object by the scale factor.
 * This function modifies the original object.
 * @param {nutritionObj} obj The nutiriton object
 * @param {number} scale The scale factor
 */
function scaleNutritionObj(obj, scale) {
    // get a list of keys that correspond to nutrition values
    let nfKeys = Object.keys(obj).filter(x=>x.startsWith("nf_")); 
    obj.serving_qty *= scale;
    for (let key of nfKeys)
        obj[key] *= scale;
    for (let microN of obj.full_nutrients) 
        microN.value *= scale;
    return obj;
}

/**
 * Try to handle a nutritionix error response message.
 * Either re-throws the error, or raises a needs substitute message.
 * @param {*} response The response returned by nutritionix
 * @param {*} recipe The original recipe object that was sent
 */
function handleNutritionixError(response, recipe) {
    console.log(response);
    let err_code = response.errors[0].err_code;
    let warning = response.errors[0].warning;
    if (err_code != 100 && err_code != 101) throw new Error("Unresolvable problem with Nutritionix API: "+response.errors[0].warning);
    let badLine = response.errors[0].original_text;
    let badIdx = -1;
    let matches = warning.match(/line ([1-9]\d*)$/);
    if (matches) badIdx = Number(matches[1]) - 1;
    else throw new Error("Unresolvable problem with Nutritionix API: "+response.errors[0].warning);

    ingredientMap.needsReplacement(recipe[badIdx].ingredient);
    throw {needsSubstitute: recipe[badIdx].ingredient}; // will redirect to the find substitute page
}

module.exports = cachedNutritionix;