const request = require('request-promise-native');
const fs = require('fs');
const sql = require('mssql');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

/**
 * Builds an object for use by the ingredient page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function ingredientServerController(query) {
    if (!query.ingredient) throw new Error("Invalid ingredient");

    let ingName = query.ingredient;
    let ingSubName = null;
    let ingDescription = null;

    let drinks = [];

    let result = await sql.query`
    SELECT r.id, r.name AS cocktailName, r.imageURL 
    FROM dbo.ingredients i
    INNER JOIN dbo.recipeIngredients ri ON i.Id = ri.ingredientsId
    INNER JOIN dbo.recipes r ON r.Id = ri.recipesId
    WHERE i.name = ${ingName}`;

    if (result.recordset.length > 0){
        drinks = result.recordset.map(x=>{return {
            idDrink: x.id,
            strDrink: x.cocktailName,
            strDrinkThumb: x.imageURL
        }});
    }

    return {
        ingredient: ingName,
        subName: ingSubName,
        desc: ingDescription,
        drinks: drinks
    };
}

module.exports = ingredientServerController;