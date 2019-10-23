const fs = require('fs');
const crypto = require('crypto');
const request = require('request-promise-native');
const cloneDeep = require('clone-deep');
const ingredientMap = require('./ingredientMap');
const sql = require('mssql');

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

    // ingredient prepared statement
    let ps = new sql.PreparedStatement();
    ps.input('ingName', sql.VarChar)
    await ps.prepare(`
    SELECT ing.[name], ing.imageURL, u.symbol, nut.[nutritionId], nut.amount, ref.[name] AS nutrientName, ref.usdaTag
    FROM ingredients ing 
    INNER JOIN units u on u.id = ing.unitid
    LEFT OUTER JOIN ingredientsNutrition nut ON nut.ingredientsId = ing.id 
    LEFT OUTER JOIN nutritionRef ref ON nut.nutritionid = ref.id
    WHERE ing.[name] = @ingName`);

    let unknownIngredients = [];

    for (let line of recipe) {
        let res = await ps.execute({ingName: line.ingredient});
        if (!res.recordset.length) {
            // Ingredient doesn't exist. Create it.
            let unitResult = await sql.query`SELECT id FROM units WHERE symbol = ${line.unit}`;
            if (!unitResult.recordset.length) 
                throw new Error("Invalid unit");
            let unitId = unitResult.recordset[0].id;
            await sql.query`INSERT INTO ingredients ([name], unitId) VALUES (${line.ingredient}, ${unitId})`;
            // requery new ingredient
            res = await ps.execute({ingName: line.ingredient});
        }
        if (!res.recordset[0].nutritionId) {
            // Ingredient exists but no nutrition info
            unknownIngredients.push(line);
        } else {
            // Everything went fine
            function getByUsdaTag(recordset, tag) {
                let f = recordset.find(x=>x.usdaTag === tag);
                if (!f) return 0;
                else return f.amount;
            }
            line.nutrition = {
                food_name: line.ingredient,
                serving_qty: 100,
                serving_unit: res.recordset[0].symbol,
                nf_calories: getByUsdaTag(res.recordset, "ENERC_KCAL"),
                nf_total_fat: getByUsdaTag(res.recordset, "FAT"),
                nf_saturated_fat: getByUsdaTag(res.recordset, "FASAT"),
                nf_cholesterol: getByUsdaTag(res.recordset, "CHOLE"),
                nf_sodium: getByUsdaTag(res.recordset, "NA"),
                nf_total_carbohydrate: getByUsdaTag(res.recordset, "CHOCDF"),
                nf_dietary_fiber: getByUsdaTag(res.recordset, "FIBTG"),
                nf_sugars: getByUsdaTag(res.recordset, "SUGAR"),
                nf_protein: getByUsdaTag(res.recordset, "PROCNT"),
                nf_potassium: getByUsdaTag(res.recordset, "K"),
                full_nutrients: res.recordset.map(x=>{return{
                    attr_id: x.nutritionId,
                    value: x.amount
                }}),
                photo: {
                    thumb: res.recordset[0].imageURL
                }
            }
        }
    }
    await ps.unprepare();

    // handle unknown ingredients
    if (unknownIngredients.length) {
        let nlpRecipe = unknownIngredients.map(x=>
            "100" + x.unit + " " +x.ingredient
        ).join("\n");
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
            ps = new sql.PreparedStatement();
            ps.input('ingName', sql.VarChar);
            ps.input('nutritionId', sql.Int);
            ps.input('amount', sql.Float);
            await ps.prepare(`
                INSERT INTO ingredientsNutrition (ingredientsId, nutritionId, amount) VALUES (
                    (SELECT TOP(1) id FROM ingredients where [name] = @ingName),
                    @nutritionId,
                    @amount
                )`);

            for (let i = 0; i < response.foods.length; i++) {
                // add image to DB
                await sql.query`UPDATE ingredients SET imageURL=${response.foods[i].photo.thumb} WHERE [name]=${unknownIngredients[i].ingredient}`;
                // put nutrition on local copy of recipe
                unknownIngredients[i].nutrition = response.foods[i];
                // save nutrition to DB
                for (let nut of response.foods[i].full_nutrients) {
                    await ps.execute({
                        ingName: unknownIngredients[i].ingredient,
                        nutritionId: nut.attr_id,
                        amount: nut.value
                    });
                }
            }
            await ps.unprepare();
        }
    }

    // OK so by this point everything should be set up
    // scale nutrition values
    for (let line of recipe) {
        let scale = 1/line.nutrition.serving_qty*line.amount;
        scaleNutritionObj(line.nutrition, scale);
    }

    return {foods: recipe.map(x=>x.nutrition)}
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
    obj.serving_weight_grams *= scale;
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

    if (recipe[badIdx].edited) throw new Error("Invalid edit to ingredient");
    
    ingredientMap.needsReplacement(recipe[badIdx].ingredient);
    throw {needsSubstitute: recipe[badIdx].ingredient}; // will redirect to the find substitute page
}

module.exports = cachedNutritionix;