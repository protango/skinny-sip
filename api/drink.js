const request = require('request-promise-native');

function drinkApi(router) {
    router.get('/api/Drink/:id', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let result = {};
        
        
        res.send(result);
    });
}

module.exports = randomApi;