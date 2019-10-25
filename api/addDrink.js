const express = require('express');
const sql = require('mssql');
const userManager = require("./internal/userManager");
/**
 * Binds API endpoints to the router related to login
 * @param {express.Router} router The router object to attach the API to
 */
function addDrinkApi(router) {
    router.get('/api/addDrink', async (req, res) => {
        let username = userManager.getUsername(req);
        if (!username) throw new Error("Unauthorised, you must be logged in to do this");

        let result = await sql.query`DECLARE @userId INT = 0

        SELECT @userId = id
        FROM dbo.users
        WHERE username = ${username}

        INSERT INTO dbo.recipes(name, userId, category, instructions,imageURL) VALUES
        (${username}+'''s cocktail',@userId,'','','/img/genericCocktail.png')

        Select SCOPE_IDENTITY() as drinkId`;

        if (result.recordset.length > 0){
            ingredientsResult = result.recordset.map(x=>{return {
                drinkId: x.drinkId
            }})[0];
        };

        res.redirect(302, '/Edit?id='+ingredientsResult.drinkId);
    });
}

module.exports = addDrinkApi;