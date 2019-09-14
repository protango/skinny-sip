'use strict';

const express = require('express');
const routes = require('./routing');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const app = express();
app.set('view engine', 'ejs');

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Routing
app.use('/', routes);

// Start App
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);