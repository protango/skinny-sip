const express = require('express');
const sql = require('mssql');
const crypto = require('crypto');


/**
 * Binds API endpoints to the router related to registration
 * @param {Router} router The router object to attach the API to
 */
function registerApi(router) {
    router.post('/api/register', async (req, res) => {
        let username = req.body.username || "";
        let password = req.body.password || "";
        let fullname = req.body.fullName || "";
        let rpt_password = req.body.rpt_password || "";

        // validation checks
        if (!username || !password || !rpt_password || !fullname) {
            res.redirect(302, `/Login?registerstatus=Fill out all mandatory fields&regun=${username}&regfn=${fullname}`);
            return;
        }
        if (password !== rpt_password) {
            res.redirect(302, `/Login?registerstatus=Passwords do not match&regun=${username}&regfn=${fullname}`);
            return;
        }

        // check if username taken
        let result = await sql.query`select * from users where username = ${username}`;
        if (result.recordset.length > 0) {
            res.redirect(302, `/Login?registerstatus=Username is taken&regun=${username}&regfn=${fullname}`);
            return;
        }

        // register the user
        let pwHash = crypto.createHash('sha256').update(password, 'utf8').digest('base64');
        result = await sql.query`INSERT INTO users (fullName, username, [password]) VALUES (${fullname}, ${username}, ${pwHash})`;
        res.redirect(302, `/Login?registergood=good`);
    });
}

module.exports = registerApi;