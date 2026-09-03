const express = require('express');
const testController = require('./test.controller');

const router = express.Router();

// Base path mounted at /api/test in app.js
router.post('/', testController.create);
router.get('/', testController.getAll);
router.get('/:id', testController.getOne);
router.put('/:id', testController.update);
router.delete('/:id', testController.remove);

module.exports = router;
