const request = require('request-promise-native');

function drinkApi(router) {
    router.post('/api/Nutrition', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let body = req.body;
        let result = {};

        if (!body.recipe) return res.send(result);

        res.send(await require("./internalNutritionApi")(body.recipe, body.name));
    });
}

module.exports = drinkApi;