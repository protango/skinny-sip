const express = require('express');
const sql = require('mssql');
const crypto = require('crypto');

const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/../config/apiKeys.json')).apiKeys;

sql.connect(apiKeys.dbConnString)

/**
 * Binds API endpoints to the router related to login
 * @param {express.Router} router The router object to attach the API to
 */
function loginApi(router) {
    router.post('/api/login', async (req, res) => {
        let username = req.body.username || "";
        let password = req.body.password || "";

        let pwHash = crypto.createHash('sha256').update(password, 'utf8').digest('base64');

        let result = await sql.query`select * from users where username = ${username} and [password] = ${pwHash}`;

        if (result.recordset.length > 0) {
            // yay
            res.redirect(302, '/');
        } else {
            // nay
            res.redirect(302, '/Login?loginstatus=Incorrect%20username%20and%2For%20password');
        }
    });
}

module.exports = loginApi;