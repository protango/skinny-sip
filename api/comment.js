const express = require('express');
const sql = require('mssql');

/**
 * Binds API endpoints to the router related to login
 * @param {express.Router} router The router object to attach the API to
 */
function commentApi(router) {
    router.post('/api/comment', async (req, res) => {
        
        let comment = req.body.comment || "";
        let username = "zac";
        let drinkId = Number(req.body.drinkId || 0);

        if (isNaN(Number(drinkId))) throw new Error("Invalid Id");
        if (comment == "") throw new Error("Empty Comment");
        if (username == "") throw new Error("Must Be Logged In");

        let result = await sql.query`DECLARE @userId INT = 0

        SELECT @userId = id
        FROM dbo.users
        WHERE username = ${username}

        INSERT INTO dbo.comments(text,userId) VALUES
        (${comment}, @userId);
        
        INSERT INTO dbo.recipeComments(recipesId,commentId) VALUES
        (${drinkId}, IDENT_CURRENT ('dbo.comments'));`;

        res.redirect(302, '/Drink?id='+req.body.drinkId);
    });
}

module.exports = commentApi;