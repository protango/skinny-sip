'use strict';

const express = require('express');
const routes = require('./routing');

// Constants
const PORT = 80;
const HOST = '0.0.0.0';

// App
const app = express();

// Routing
app.use('/', routes);

// Expose public folder
app.use(express.static('public'));

// Start App
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);