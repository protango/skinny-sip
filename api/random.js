const request = require('request-promise-native');
const sql = require('mssql');

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
            let result = await sql.query`SELECT TOP (${number}) r.id, r.name, r.category, r.imageURL, u.username FROM dbo.recipes r LEFT JOIN dbo.users u ON u.id = r.userId ORDER BY newid()`;
            if (result.recordset.length > 0){
                result = result.recordset.map(x=>{return {
                            name: x.name,
                            id: x.id,
                            desc: x.category,
                            img: x.imageURL,
                            tags: x.username ? [x.username] : []
                }});
            }
            res.send(result);
        } else {
            res.send(result);
        }
    });
}

module.exports = randomApi;