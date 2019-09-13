const fs = require('fs');
const crypto = require('crypto');
const request = require('request-promise-native');

const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const cache = JSON.parse(fs.readFileSync(__dirname + '/../../config/nutritionixCache.json'));

async function cachedNutritionix(nlpRecipe) {
    let lines = nlpRecipe.split("\n");
    let unknownLines = [];
    let simResponse = {foods: []};
    for (let line of lines) {
        let hash = crypto.createHash('md5').update(line).digest('base64');
        let cacheMatch = cache[hash];
        if (cacheMatch) {
            simResponse.foods.push(cacheMatch);
        } else {
            unknownLines.push(line);
        }
    }
    if (unknownLines.length) {
        // get nutritionix response
        let response = await request({
            method: 'POST',
            uri: 'https://trackapi.nutritionix.com/v2/natural/nutrients',
            body: {
                query: unknownLines.join("\n"),
                line_delimited: true
            },
            json: true,
            headers: apiKeys.nutritionix
        });
        if (response.errors && response.errors.length) {
            simResponse.errors = response.errors;
        } else {
            for (let i = 0; i<response.foods.length; i++) {
                let food = response.foods[i];
                let hash = crypto.createHash('md5').update(unknownLines[i]).digest('base64');
                // write to simulated response
                simResponse.foods.push(food);
    
                // write to memory cache
                cache[hash] = food;
            }
            //save cache to disk
            fs.writeFileSync(__dirname + '/../../config/nutritionixCache.json', JSON.stringify(cache), function(err) {
                if(err) throw err;
            }); 
        }
    }
    return simResponse;
}

module.exports = cachedNutritionix;