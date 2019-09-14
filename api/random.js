const request = require('request-promise-native');

/**
 * Binds API endpoints to the router related to getting random drinks
 * @param {Router} router The router object to attach the API to
 */
function randomApi(router) {
    router.get('/api/Random/:number', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let result = [];
        let number = Number(req.params.number);

        if (!isNaN(Number(number))) {
            let promises = [];
            for (let i = 0; i<number; i++) {
                promises.push(
                    request({
                        uri: 'https://www.thecocktaildb.com/api/json/v1/1/random.php',
                        json: true
                    })
                );
            }
            result = await Promise.all(promises);
            result = result.map(x=>{return {
                name: x.drinks[0].strDrink,
                id: x.drinks[0].idDrink,
                desc: x.drinks[0].strCategory,
                img: x.drinks[0].strDrinkThumb,
                tags: x.drinks[0].strTags ? x.drinks[0].strTags.split(",") : []
            }});
            res.send(result);
        } else {
            res.send(result);
        }
    });
}

module.exports = randomApi;