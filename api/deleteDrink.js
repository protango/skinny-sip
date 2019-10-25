const express = require('express');
const sql = require('mssql');
const userManager = require("./internal/userManager");
/**
 * Binds API endpoints to the router related to login
 * @param {express.Router} router The router object to attach the API to
 */
function deleteDrinkApi(router) {
    router.post('/api/deleteDrink', async (req, res) => {      
        let id = Number(req.body.drinkId);
        let userName = userManager.getUsername(req);
        if (isNaN(id)) throw new Error("Invalid ID");
        if (!userName) throw new Error("Unauthorised, you must be logged in to do this");

        let rs = (await sql.query`SELECT TOP(1) u.[username] FROM recipes r INNER JOIN [users] u on r.userid = u.id WHERE r.id = ${id}`).recordset;
        let originalAuthor = rs.length ? rs[0].username : null;
        if (originalAuthor !== userName) throw new Error("Unauthorised, only the original author can delete their cocktail recipe");

        let recipeDelete = await sql.query`
            DECLARE @valid INT = 0

            SELECT @valid = COUNT(*)
            FROM dbo.recipes r
            INNER JOIN dbo.users u ON r.userId = u.id
            WHERE u.username = ${userName} 
            AND r.id = ${id} 
        
            IF @valid = 1
            BEGIN
                DELETE
                FROM dbo.recipeComments
                WHERE recipesId = ${id} 
        
                DELETE
                FROM dbo.recipeIngredients
                WHERE recipesId = ${id} 
        
                DELETE
                FROM dbo.recipes
                WHERE id = ${id} 
            END`;


        res.redirect(302, '/');
    });
}

module.exports = deleteDrinkApi;