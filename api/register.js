const request = require('request-promise-native');

/**
 * Binds API endpoints to the router related to registration
 * @param {Router} router The router object to attach the API to
 */
function registerApi(router) {
    router.post('/api/register', async (req, res) => {
        
    });
}

module.exports = registerApi;