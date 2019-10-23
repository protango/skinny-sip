'use strict';
// setup global sql connection
const fs = require('fs');
const sql = require('mssql');
const apiKeys = JSON.parse(fs.readFileSync(__dirname + '/config/apiKeys.json')).apiKeys;
sql.connect(apiKeys.dbConnString)

const express = require('express');
const path = require('path')
const routes = require('./routing');
const cookieParser = require('cookie-parser');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(cookieParser());

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Routing
app.use('/', routes);

// Start App
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
