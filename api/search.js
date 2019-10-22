const request = require('request-promise-native');

/**
 * Binds API endpoints to the router related to getting search results
 * @param {Router} router The router object to attach the API to
 */
function searchApi(router) {
    router.get('/api/Search/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let result = [];
        let text = req.params.text;
        if (text.length >= 1) {
            let body =  await request({
                uri: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
                qs: {s: text },
                json: true
            });
            if (body.drinks) 
                result = body.drinks.map(x=>{return {
                    name: x.strDrink,
                    id: x.idDrink,
                    desc: x.strCategory,
                    img: x.strDrinkThumb,
                    tags: x.strTags ? x.strTags.split(",").map(x=>x.replace(/([a-z])([A-Z])/g, "$1 $2")) : []
                }});
            res.send(result);
        } else {
            res.send([]);
        }
    });
}

module.exports = searchApi;