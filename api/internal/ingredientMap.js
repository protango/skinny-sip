const fs = require('fs');
const request = require('request-promise-native');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const mappings = JSON.parse(fs.readFileSync(__dirname + '/../../config/unknownIngredientsMap.json'));
const sql = require('mssql');
const cachedNutritionix = require('./cachedNutritionix');

module.exports = {
    /**
     * Remaps an ingredient to a similar one known by nutritionix, if the ingredient is not mapped, returns the original ingredient
     * @param {string} ingredient 
     */
    map: function (ingredient) {
        let mapping = mappings[ingredient];
        if (mapping && mapping.replacement) return mapping.replacement;
        return ingredient;
    }, 
    /**
     * Saves a new ingredient mapping. 
     * The ingredient must be marked as "needsReplacement" before using this function.
     * Throws exception if the substitute is not known by nutirtionix
     * @param {string} ingredient The original ingredient
     * @param {string} substitute The substitute ingredient
     */
    save: async function (ingredient, substitute) {
        // test that request is properly formed
        if (!ingredient || !substitute) throw new Error("Bad Request");
        ingredient = ingredient.toLowerCase();
        substitute = substitute.toLowerCase();

        // test that this ingredient actually needs replacement
        let unitResult = await sql.query`
            SELECT TOP(1) ing.id AS ingId, u.symbol, nut.id AS nutId FROM ingredients ing 
            INNER JOIN units u on ing.unitid = u.id
            LEFT OUTER JOIN ingredientsNutrition nut ON ing.id = nut.ingredientsid
            WHERE ing.[name] = ${ingredient}`;
        if (!unitResult.recordset.length) 
            throw new Error("Ingredient does not exist");
        if (unitResult.recordset[0].nutId) 
            throw new Error("Ingredient does not require substitute");

        // test that replacement is valid
        let instantResponse =  await request({
            uri: 'https://trackapi.nutritionix.com/v2/search/instant',
            qs: {query: substitute },
            json: true,
            headers: apiKeys.nutritionix
        });
        if (!(instantResponse && instantResponse.common && instantResponse.common.length && instantResponse.common.some(x=>x.food_name.toLowerCase() === substitute)))
            throw new Error("Invalid replacement value");

        // get replacement nutrition
        let nutrition = await cachedNutritionix([{
            amount: 100,
            unit: unitResult.recordset[0].symbol,
            ingredient: substitute,
            measure: "100 " + unitResult.recordset[0].symbol
        }]);

        // save replacement nutrition as if it belonged to the ingredient
        let ps = new sql.PreparedStatement();
        ps.input('ingName', sql.VarChar);
        ps.input('nutritionId', sql.Int);
        ps.input('amount', sql.Float);
        await ps.prepare(`
            INSERT INTO ingredientsNutrition (ingredientsId, nutritionId, amount) 
            SELECT TOP(1) id, @nutritionId, @amount
            FROM ingredients where [name] = @ingName AND
            EXISTS (SELECT * FROM nutritionRef WHERE id = @nutritionId)`);
        for (let nut of nutrition.foods[0].full_nutrients) {
            await ps.execute({
                ingName: ingredient,
                nutritionId: nut.attr_id,
                amount: nut.value
            });
        }

        let updIngPs = new sql.PreparedStatement();
        updIngPs.input('srvWeight', sql.Int);
        updIngPs.input('ingName', sql.VarChar);
        await updIngPs.prepare(`UPDATE ingredients SET servingWeight=@srvWeight WHERE [name]=@ingName`);
        await updIngPs.execute({srvWeight: nutrition.foods[0].serving_weight_grams, ingName: ingredient});
        await updIngPs.unprepare();
    },
    /**
     * Flags an ingredient as unknown by nutritionix, this allows it to be replaced through the "save" function.
     * This system is in place for security
     * @param {*} ingredient The ingredient that needs a replacement
     */
    needsReplacement: function(ingredient) {

    }
}
