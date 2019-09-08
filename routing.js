const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile("views/index.html", { root: __dirname });
});

// Expose client side JS modules
router.use('/inc/jquery', express.static(__dirname + '/node_modules/jquery/dist/'));
router.use('/inc/bootstrap', express.static(__dirname + '/node_modules/bootstrap/dist/'));

module.exports = router;