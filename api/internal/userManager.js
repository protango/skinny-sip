const express = require('express');
const jwt = require('jsonwebtoken');

const fs = require('fs');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/config/apiKeys.json')).apiKeys;

module.exports = {
    /**
     * Refreshes a users auth session, if there is one. Also returns the username of the current user, or null if no one is logged in
     * @param {express.Request} req 
     * @param {express.Response} res 
     * @returns {string} The currently logged in username
     */
    refreshAuth: function(req, res) {
        let auth = req.cookies.auth;
        if (auth) {
          try {
            let payload = jwt.verify(auth, apiKeys.jwtSecret);
            res.cookie('auth', jwt.sign({ sub: payload.sub }, apiKeys.jwtSecret, { expiresIn: '1h' }), { maxAge: 3600000 });
            return payload.sub;
          } catch {
            res.clearCookie("auth");
            return null;
          }
        } else {
          return null;
        }
    },
    /**
     * Returns the username of the current user, or null if no one is logged in
     * @param {express.Request} req 
     * @returns {string} The currently logged in username
     */
    getUsername: function(req) {
        let auth = req.cookies.auth;
        if (auth) {
          try {
            let payload = jwt.verify(auth, apiKeys.jwtSecret);
            return payload.sub;
          } catch {
            return null;
          }
        } else {
          return null;
        }
    }
}
