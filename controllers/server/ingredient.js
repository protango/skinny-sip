const request = require('request-promise-native');
const fs = require('fs');
const sql = require('mssql');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;

/**
 * Builds an object for use by the ingredient page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function ingredientServerController(query) {
    let id = Number(query.id);
    if (isNaN(Number(id))) throw new Error("Invalid Id");

    let ingName = "";
    let ingSubName = "";
    let ingDescription = "";

    let resultIngredient = await sql.query`
    SELECT name 
    FROM dbo.ingredients i
    WHERE i.id = ${id}`;

    if (resultIngredient.recordset.length > 0){
        ingName = resultIngredient.recordset[0].name;
    }

    let drinks = [];

    let resultRecipe = await sql.query`
    SELECT r.id, r.name AS cocktailName, r.imageURL 
    FROM dbo.ingredients i
    INNER JOIN dbo.recipeIngredients ri ON i.Id = ri.ingredientsId
    INNER JOIN dbo.recipes r ON r.Id = ri.recipesId
    WHERE i.id = ${id}`;

    if (resultRecipe.recordset.length > 0){
        drinks = resultRecipe.recordset.map(x=>{return {
            idDrink: x.id,
            strDrink: x.cocktailName,
            strDrinkThumb: x.imageURL
        }});
    }

    return {
        id: id,
        ingredient: ingName,
        subName: ingSubName,
        desc: ingDescription,
        drinks: drinks
    };
}

module.exports = ingredientServerController;