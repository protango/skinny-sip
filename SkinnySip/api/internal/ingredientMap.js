const fs = require('fs');
const request = require('request-promise-native');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const mappings = JSON.parse(fs.readFileSync(__dirname + '/../../config/unknownIngredientsMap.json'));

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
        let existingObj = mappings[ingredient];
        if (!existingObj || !existingObj.needsReplacement) throw new Error("You are not permitted to perform this action");

        // test that replacement is valid
        let instantResponse =  await request({
            uri: 'https://trackapi.nutritionix.com/v2/search/instant',
            qs: {query: substitute },
            json: true,
            headers: apiKeys.nutritionix
        });
        if (!(instantResponse && instantResponse.common && instantResponse.common.length && instantResponse.common.some(x=>x.food_name.toLowerCase() === substitute)))
            throw new Error("Invalid replacement value");

        // save replacement
        mappings[ingredient] = {replacement: substitute};
        fs.writeFileSync(__dirname + '/../../config/unknownIngredientsMap.json', JSON.stringify(mappings), function(err) {
            if(err) throw err;
        }); 
    },
    /**
     * Flags an ingredient as unknown by nutritionix, this allows it to be replaced through the "save" function.
     * This system is in place for security
     * @param {*} ingredient The ingredient that needs a replacement
     */
    needsReplacement: function(ingredient) {
        mappings[ingredient.toLowerCase()] = {needsReplacement: true};
        fs.writeFileSync(__dirname + '/../../config/unknownIngredientsMap.json', JSON.stringify(mappings));
    }
}
