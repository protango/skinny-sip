const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../config/apiKeys.json')).apiKeys;

/**
 * Binds API endpoints to the router related to editing recipes
 * @param {Router} router The router object to attach the API to
 */
function instantEditingApi(router) {
    // simply pass through the response from the nutirtionix api to the client, we do this to hide our API key
    router.get('/api/instantIngredient/:text', async (req, res) => {
        
    });
    router.post('/api/saveRecipe', async (req, res) => {

    });
}

module.exports = instantEditingApi;