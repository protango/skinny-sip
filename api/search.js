const request = require('request-promise-native');

function searchApi(router) {
    router.get('/api/Search/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let result = {};
        let text = req.params.text;
        if (text.length >= 3) {
            let body =  await request({
                uri: 'https://www.thecocktaildb.com/api/json/v1/1/search.php',
                qs: {s: text },
                json: true
            });
            result = body.drinks.map(x=>{return {
                name: x.strDrink,
                id: x.idDrink,
                desc: x.strCategory,
                img: x.strDrinkThumb,
                tags: x.strTags ? x.strTags.split(",") : []
            }});
            res.send(result);
        } else {
            res.send({});
        }
    });
}

module.exports = searchApi;