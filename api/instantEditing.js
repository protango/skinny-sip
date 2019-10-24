const fs = require('fs');
const express = require('express');
const sql = require('mssql');
const nutrition = require("./internal/nutrition");
const userManager = require("./internal/userManager");
const genericImgURL = __dirname + '/../img/genericCocktail.png';

/**
 * Binds API endpoints to the router related to editing recipes
 * @param {express.Router} router The router object to attach the API to
 */
function instantEditingApi(router) {
    router.get('/api/instantIngredient/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let text = req.params.text;
        if (!text || text.length < 3) return [];
        let r = await sql.query`
            SELECT TOP(10) [name], id, u.symbol
            FROM ingredients ing 
            INNER JOIN units u ON u.id = ing.unitid
            WHERE ing.[name] LIKE '%${text}%'`;
        /** @type {instantResult[]} */
        let result = r.recordset.map(x=>{return {
            id: x.id,
            ingredient: x.name,
            unit: x.symbol
        }});
        return result;
    });
    router.post('/api/liveNutrition', async (req, res) => {
        /** @type {nutrition.recipeLine[]} */
        let inputRecipe = req.body;

        let nutritionResult = await nutrition(inputRecipe);

        /** @type {liveNutritionResult} */
        let result = {};
    });
    router.post('/api/createRecipe', async (req, res) => {
        /** @type {{id:number, name:string, category: string, recipe: nutrition.recipeLine[]}} */
        let input = req.body;
        let userName = userManager.getUsername();
        if (!userName) throw new Error("Unauthorised, you must be logged in to do this");

        let drink = input.drinks
        let ingredients = input.ingredients;
        let volumes = input.volume;
        let units = input.unit;
        
        for(let i = 0; i < ingredients.length; i++){

        }
        // logic here

        // send whether save was successful or not
        res.setHeader('Content-Type', 'application/json');
        if (1==1) {
            res.send({success: true});
        } else {
            res.send({success: false, reason: "Some error reason"});
        }
    });
    router.post('/api/saveRecipe', async (req, res) => {
        /** @type {{id:number, name:string, category: string, method : string, recipe: nutrition.recipeLine[]}} */
        let input = req.body;
        let userName = userManager.getUsername(req);
        if (!userName) throw new Error("Unauthorised, you must be logged in to do this");

        let recipeUpdate = await sql.query`
            DECLARE @userId INT

            SELECT @userId = id
            FROM dbo.users
            WHERE username = @userName
        
            UPDATE dbo.recipes(name,userId,category,instructions,imageURL) VALUES
            SET name = ${input.name}, editedUserId = @userId, category = ${input.category}, instructions = ${input.method}
            WHERE id = ${Number(input.id)}
            
            DELETE 
            FROM dbo.recipeIngredients
            WHERE recipesId = ${Number(input.id)}`;

            let ingredientUpdate = new sql.PreparedStatement();
            ingredientUpdate.input('recipeId', sql.Int)
            ingredientUpdate.input('ingredientName', sql.VarChar)
            ingredientUpdate.input('unitSymbol', sql.VarChar)
            ingredientUpdate.input('ammount', sql.Float)

            await ingredientUpdate.prepare(`
                DECLARE @ingredientId INT = 0
                DECLARE @recipeId INT = 0

                SELECT @ingredientId = id
                FROM dbo.ingredients
                WHERE name = @ingredientName

                IF @ingredientId = 0
                BEGIN
                    DECLARE @unitId int = 0

                    SELECT @unitId = id
                    FROM dbo.units
                    WHERE symbol = @unitSymbol

                    INSERT INTO dbo.ingredients(name, unitId) VALUES
                    (@ingredientName, @unitId)

                    SELECT @ingredientId = SCOPE_IDENTITY()
                END

                INSERT INTO dbo.recipeIngredients(recipesId, ingredientsId, amount) VALUES
                (@recipeId,@ingredientId,@ammount)`);

        for(let i = 0; i < input.recipe.length; i++){
            if(input.recipe[i].ingredient != "" && input.recipe[i].amount != ""){
            let ingredientUpdate = await ps.execute(
                {recipeId: input.id},
                {ingredientName: input.recipe[i].ingredient},
                {unitSymbol: input.recipe[i].unit},
                {ammount: input.recipe[i].amount});
            }
        }

        // send whether save was successful or not
        res.setHeader('Content-Type', 'application/json');
        if (1==1) {
            res.send({success: true});
        } else {
            res.send({success: false, reason: "Some error reason"});
        }
    });
    router.get('/api/deleteRecipe/:id', async (req, res) => {
        let id = Number(req.params.id);
        let userName = userManager.getUsername(req);
        if (isNaN(id)) throw new Error("Invalid ID");
        if (!userName) throw new Error("Unauthorised, you must be logged in to do this");

        // logic here

        // send whether delete was successful or not
        res.setHeader('Content-Type', 'application/json');
        res.send({success: true});
    });
}

module.exports = instantEditingApi;

/** 
 * @typedef {object} instantIngredientResult
 * @property {number} id The ingredient id
 * @property {string} ingredient The ingredient Name
 * @property {string} unit The ingredients unit symbol
 */

 /** 
 * @typedef {object} liveNutritionResult
 * @property {number} stdDrinks
 * @property {number} servingWeight
 * @property {number} servingsPerPackage
 * @property {nutritionTableRow[]} mainNutrients
 * @property {nutritionTableRow[]} microNutrients
 * @property {number[]} individualEnergies The energy of each individual ingredient, in kJ
 */

 /** 
  * @typedef {object} nutritionTableRow
  * @property {string} name
  * @property {number} amountPerServing
  * @property {number} rdiPercent
  * @property {number} amountPer100g
  * @property {string} unit
  */