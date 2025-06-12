import express from 'express';
import authJwt from '../middlewares/authJwt.js';
import CategoryController from '../controllers/category.controller.js';

const router = express.Router();
const categoryController = new CategoryController();

router.post('/', authJwt.verifyToken, authJwt.isEditorOrAdmin, categoryController.createCategory);

router.get('/', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);

router.put('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, categoryController.updateCategory);

router.delete('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, categoryController.deleteCategory);

export default router;