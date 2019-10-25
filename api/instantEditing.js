const fs = require('fs');
const express = require('express');
const sql = require('mssql');
const nutrition = require("./internal/nutrition");
const userManager = require("./internal/userManager");
const imageManager = require("./internal/imageManager");
const genericImgURL = __dirname + '/../img/genericCocktail.png';
const microNutrients = JSON.parse(fs.readFileSync(__dirname + '/../config/micronutrients.json')).microNutrients;


/**
 * Binds API endpoints to the router related to editing recipes
 * @param {express.Router} router The router object to attach the API to
 */
function instantEditingApi(router) {
    router.get('/api/instantIngredient/:text', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        let text = req.params.text;
        if (!text || text.length === 0) {
            res.send([]);
            return;
        }
        let r = await sql.query`
            SELECT TOP(10) ing.[name], ing.id, u.symbol, ing.imageURL
            FROM ingredients ing 
            INNER JOIN units u ON u.id = ing.unitid
            WHERE ing.[name] LIKE ${'%'+text+'%'}`;
        /** @type {instantResult[]} */
        let result = r.recordset.map(x=>{return {
            id: x.id,
            ingredient: x.name,
            unit: x.symbol,
            imageURL: x.imageURL || "https://www.thecocktaildb.com/images/ingredients/"+x.name+"-Small.png"
        }});
        res.send(result);
    });
    router.post('/api/liveNutrition', async (req, res) => {
        /** @type {nutrition.recipeLine[]} */
        let inputRecipe = req.body.recipe;

        let ps = new sql.PreparedStatement();
        ps.input('ingName', sql.VarChar)
        await ps.prepare(`SELECT * FROM ingredients WHERE [name]=@ingName`);
        for (let line of inputRecipe) 
            if (!(await ps.execute({ingName: line.ingredient})).recordset.length) 
                line.unknown = true;
        await ps.unprepare();

        let nutritionResult;
        try {
            nutritionResult = await nutrition(inputRecipe.filter(x=>!x.unknown));
        } catch {
            res.status(500);
            res.send("Nutrition Problem");
            return;
        }
        let n = nutritionResult.aggregate;
        let alcObj = n.full_nutrients.find(x=>x.attr_id===221);
        let buildNutRow = function(name, value, rdi, unit, subVal) {
            return {
                name: name.toUpperCase(),
                amountPerServing: Math.round(value*10) / 10,
                rdiPercent: rdi ? Math.round(value / rdi * 100) : null,
                amountPer100g: Math.round(value / n.serving_weight_grams * 100 * 10) / 10 || 0,
                unit: unit,
                subVal: subVal || false
            }
        }
        /** @type {liveNutritionResult} */
        let result = {
            stdDrinks: alcObj ? Math.round(alcObj.value / 10 * 10) / 10 : 0,
            servingWeight: n.serving_weight_grams,
            servingsPerPackage: n.serving_qty,
            mainNutrients: [
                buildNutRow("ENERGY", n.nf_calories * 4.184, 8700, "kJ"),
                buildNutRow("protein", n.nf_protein, 50, "g"),
                buildNutRow("fat, total", n.nf_total_fat, 70, "g"),
                buildNutRow("saturated", n.nf_saturated_fat, 24, "g", true),
                buildNutRow("CARBOHYDRATE", n.nf_total_carbohydrate, 310, "g"),
                buildNutRow("SUGARS", n.nf_sugars, 90, "g", true),
                buildNutRow("dietary fibre", n.nf_dietary_fiber, 30, "g"),
                buildNutRow("sodium", n.nf_sodium, 2300, "mg"),
                buildNutRow("potassium", n.nf_potassium, 3300, "mg"),
                buildNutRow("cholestrol", n.nf_cholesterol, 0, "mg")
            ],
            microNutrients: n.full_nutrients.map(x => {
                let match = microNutrients.find(y => y.id === x.attr_id);
                if (!match) return null;
                return buildNutRow(match.name, x.value, match.rdi, match.unit);
            }).filter(x => x),
            individualEnergies: inputRecipe.map(x=>{
                let m = nutritionResult.ingredients.find(y=>y.food_name.toLowerCase()===x.ingredient.toLowerCase());
                if (m == null) return null;
                return Math.round(m.nf_calories * 4.184);
            })
        };
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
    });
    router.post('/api/saveRecipe', async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        const transaction = new sql.Transaction();
        await transaction.begin();
        const sqlRequest = new sql.Request(transaction);
        try {
            /** @type {{id:number, name:string, category: string, method : string, recipe: nutrition.recipeLine[]}} */
            let input = JSON.parse(req.body.drinkData);
            let userName = userManager.getUsername(req);
            if (!userName) throw new Error("Unauthorised, you must be logged in to do this");
            if (isNaN(input.id)) throw new Error("Invalid ID");

            /**@type {sql.IProcedureResult}*/
            let recipeUpdateResult= await sqlRequest.query`
                DECLARE @userId INT

                SELECT @userId = id
                FROM dbo.users
                WHERE username = ${userName}
            
                UPDATE dbo.recipes 
                SET [name] = ${input.name}, editedUserId = @userId, category = ${input.category}, instructions = ${input.method}
                WHERE id = ${Number(input.id)}
                
                DELETE 
                FROM dbo.recipeIngredients
                WHERE recipesId = ${Number(input.id)}`;

            let ingredientUpdate = new sql.PreparedStatement(transaction);
            ingredientUpdate.input('recipeId', sql.Int)
            ingredientUpdate.input('ingredientName', sql.VarChar)
            ingredientUpdate.input('unitSymbol', sql.VarChar)
            ingredientUpdate.input('ammount', sql.Float)
            await ingredientUpdate.prepare(`
                DECLARE @ingredientId INT = 0

                SELECT @ingredientId = id
                FROM dbo.ingredients
                WHERE [name] = @ingredientName

                IF @ingredientId = 0
                BEGIN
                    DECLARE @unitId int = 0

                    SELECT @unitId = id
                    FROM dbo.units
                    WHERE symbol = @unitSymbol

                    INSERT INTO dbo.ingredients([name], unitId) VALUES
                    (@ingredientName, @unitId)

                    SELECT @ingredientId = SCOPE_IDENTITY()
                END

                INSERT INTO dbo.recipeIngredients(recipesId, ingredientsId, amount) VALUES
                (@recipeId,@ingredientId,@ammount)`);

            for(let i = 0; i < input.recipe.length; i++){
                if(input.recipe[i].ingredient != "" && input.recipe[i].amount != ""){
                let ingredientUpdateResponse = await ingredientUpdate.execute(
                    {recipeId: input.id,
                    ingredientName: input.recipe[i].ingredient,
                    unitSymbol: input.recipe[i].unit,
                    ammount: input.recipe[i].amount});
                }
            }
            await ingredientUpdate.unprepare();

            // do images if present
            if (req.files && req.files.newImg) {
                let imageData = req.files.newImg.data;
                let ext = req.files.newImg.name.split('.').pop();
                let datetimeString = new Date().toISOString().replace(/[\.:-TZ]/g, "");
                let newURL = await imageManager.uploadImage(imageData, "Recipe_"+input.id+"."+ext);
                newURL += "?d=" + datetimeString;
                await sqlRequest.query`UPDATE recipes SET imageURL=${newURL} WHERE id=${input.id}`;
            }

            // send whether save was successful or not
            await transaction.commit();
            res.send({success: true});
        } catch (e) {
            await transaction.rollback();
            console.error(e);
            res.status(500).send({message: e.message});
        }
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
  * @property {bool} subValue
  */