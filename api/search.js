const request = require('request-promise-native');
const sql = require('mssql');

/**
 * Binds API endpoints to the router related to getting search results
 * @param {Router} router The router object to attach the API to
 */
function searchApi(router) {
    router.get('/api/Search/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let like = '%'
        let result = [];
        let text = like.concat(req.params.text,like);
        if (text.length >= 1) {
            let result = await sql.query`SELECT * FROM dbo.recipes WHERE name LIKE ${text}`;
            if (result.recordset.length > 0){
                result = result.recordset.map(x=>{return {
                            name: x.name,
                            id: x.id,
                            desc: x.category,
                            img: x.imageURL,
                            tags: []
                        }});
            }
            res.send(result);
        } else {
            res.send([]);
        }
    });
}

module.exports = searchApi;