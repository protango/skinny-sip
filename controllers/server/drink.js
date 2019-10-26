const request = require('request-promise-native');
const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../../config/apiKeys.json')).apiKeys;
const sql = require('mssql');

/**
 * Builds an object for use by the drinks page EJS template
 * @param {Object} query An object containing the query string parameters 
 */
async function drinkServerController(query) {
    //console.log(query)
    let id = Number(query.id);
    if (isNaN(Number(id))) throw new Error("Invalid Id");

    let result = await sql.query`SELECT r.id, ISNULL(r.name,'') as cocktailName, u.username, ISNULL(r.category,'') as category, ISNULL(r.instructions,'') as instructions, ISNULL(r.imageURL,'') as imageURL, ISNULL(i.name,'water') AS ingredientName, ISNULL(ri.amount,300) as amount, ISNULL(un.symbol,'ml') as symbol, ISNULL(i.id,195) AS ingredientID, u2.username AS editedUser
    FROM dbo.recipes r
    LEFT JOIN dbo.recipeIngredients ri on r.id = ri.recipesId
    LEFT JOIN dbo.ingredients i on i.id = ri.ingredientsId
    LEFT JOIN dbo.units un on un.id = i.unitId
    LEFT JOIN dbo.users u on u.id = r.userId
    LEFT OUTER JOIN dbo.users u2 on u2.id = r.editedUserId
    WHERE r.id = ${id}`;

    if (result.recordset.length > 0){
        recipeResult = result.recordset.map(x=>{return {
                    name: x.cocktailName,
                    id: x.id,
                    desc: x.category,
                    method: x.instructions,
                    img: x.imageURL,
                    tags: [x.username, x.editedUser].filter(x=>x),
                    glass: ''
        }})[0];

        ingredientsResult = result.recordset.map(x=>{return {
            ingredientID: x.ingredientID,
            amount: x.amount,
            unit: x.symbol,
            ingredient: x.ingredientName,
            measure: x.amount + ' ' + x.symbol
        }});
    } else {
        throw new Error("Id does not correspond to any recipe");
    }

    //console.log(result)

    result = await sql.query`Select c.text, u.username, c.[date]
    From dbo.recipes r
    Inner Join dbo.recipeComments rc on r.id = rc.recipesId
    Inner Join dbo.comments c on c.id = rc.commentId
    Inner Join dbo.users u on u.id = c.userId 
    WHERE r.id = ${id}
    ORDER BY c.[date] DESC`;

    let commentResult = [];
    if (result.recordset.length > 0){
        commentResult = result.recordset.map(x=>{return {
                    username: x.username,
                    text: x.text,
                    date: x.date
        }});        
    }

    return {
        name: recipeResult.name,
        id: recipeResult.id,
        desc: recipeResult.desc,
        method: recipeResult.method,
        img: recipeResult.img,
        tags: recipeResult.tags,
        glass: '',
        nutrition: await require("../../api/internal/nutrition")(ingredientsResult, recipeResult.name),
        comments : commentResult,
        og_recipe: ingredientsResult
    };
}

module.exports = drinkServerController;