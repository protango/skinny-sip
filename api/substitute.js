const request = require('request-promise-native');
const fs = require('fs');
const ingredientMap = require('./internal/ingredientMap');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../config/apiKeys.json')).apiKeys;

/**
 * Binds API endpoints to the router related to substituting ingredients
 * @param {Router} router The router object to attach the API to
 */
function substituteApi(router) {
    // simply pass through the response from the nutirtionix api to the client, we do this to hide our API key
    router.get('/api/IngredientAutoComplete/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json'); 
        let text = req.params.text;
        if (text.length >= 1) {
            let body =  await request({
                uri: 'https://trackapi.nutritionix.com/v2/search/instant',
                qs: {query: text },
                json: true,
                headers: apiKeys.nutritionix
            });
            res.send(body);
        } else {
            res.send([]);
        }
    });
    router.post('/api/Substitute', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let body = req.body;

        try {
            await ingredientMap.save(body.ingredient, body.substitute);
        } catch(e) {
            console.log(e);
            res.redirect(302, '/Error?error='+e.message);
            return;
        }

        // redirect back to the drink page the user was on previously
        res.redirect(302, '/Drink?id='+body.drinkId);
    });
}

module.exports = substituteApi;