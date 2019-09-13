const fs = require('fs');
const request = require('request-promise-native');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const mappings = JSON.parse(fs.readFileSync(__dirname + '/../../config/unknownIngredientsMap.json'));

module.exports = {
    map: function (ingredient) {
        let mapping = mappings[ingredient];
        if (mapping && mapping.replacement) return mapping.replacement;
        return ingredient;
    }, 
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
    needsReplacement: function(ingredient) {
        mappings[ingredient.toLowerCase()] = {needsReplacement: true};
        fs.writeFileSync(__dirname + '/../../config/unknownIngredientsMap.json', JSON.stringify(mappings));
    }
}
