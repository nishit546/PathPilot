const express = require('express');
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { updateExpenseSchema } = require('../validators/expenseValidator');

const router = express.Router();

router.put('/expenses/:id', authMiddleware, validate(updateExpenseSchema), expenseController.updateExpense);
router.delete('/expenses/:id', authMiddleware, expenseController.deleteExpense);

module.exports = router;
