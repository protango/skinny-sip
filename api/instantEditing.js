const express = require('express');
const sql = require('mssql');
const nutrition = require("./internal/nutrition");
const userManager = require("./internal/userManager");


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
    router.post('/api/saveRecipe', async (req, res) => {
        /** @type {{id:number, name:string, category: string, recipe: nutrition.recipeLine[]}} */
        let input = req.body;
        let userName = userManager.getUsername(req, res);
        if (!userName) throw new Error("Unauthorised, you must be logged in to do this");

        // logic here

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
        let userName = userManager.getUsername(req, res);
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