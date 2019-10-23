const sql = require('mssql');

/**
 * Binds API endpoints to the router related to editing recipes
 * @param {Router} router The router object to attach the API to
 */
function instantEditingApi(router) {
    // simply pass through the response from the nutirtionix api to the client, we do this to hide our API key
    router.get('/api/instantIngredient/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let text = req.params.text;
        if (!text || text.length < 3) return [];
        let r = await sql.query`
            SELECT TOP(10) [name], id from ingredients where [name] LIKE '%${text}%'`;
        return r.recordset;
    });
    router.post('/api/saveRecipe', async (req, res) => {

    });
}

module.exports = instantEditingApi;