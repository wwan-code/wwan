import Category from "../models/Category.js";

export default class CategoryController {
    // Create a new category
    async createCategory(req, res) {
        try {
            const { title, slug } = req.body;
            const existing = await Category.findOne({ where: { slug } });
            if (existing) {
                return res.status(400).json({ error: 'Category already exists' });
            }
            const category = await Category.create({ title, slug });
            res.status(201).send({ category,message: "Category created successfully" });
        } catch (error) {
            res.status(500).send({ message: "Error creating category" });
        }
    }

    // Get all categories
    async getAllCategories(req, res) {
        try {
            const categories = await Category.findAll();
            res.status(200).send(categories);
        } catch (error) {
            res.status(500).send({ message: "Error getting categories" });
        }
    }

    // Get a category by ID
    async getCategoryById(req, res) {
        try {
            const id = req.params.id;
            const category = await Category.findByPk(id);
            if (!category) {
                res.status(404).send({ message: "Category not found" });
            } else {
                res.status(200).send(category);
            }
        } catch (error) {
            res.status(500).send({ message: "Error getting category" });
        }
    }

    // Update a category
    async updateCategory(req, res) {
        try {
            const id = req.params.id;
            const { title, slug } = req.body;
            const category = await Category.findByPk(id);
            if (!category) {
                res.status(404).send({ message: "Category not found" });
            } else {
                category.title = title;
                category.slug = slug;
                await category.save();
                res.status(200).send({ category,message: "Category updated successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error updating category" });
        }
    }

    // Delete a category
    async deleteCategory(req, res) {
        try {
            const id = req.params.id;
            const category = await Category.findByPk(id);
            if (!category) {
                res.status(404).send({ message: "Category not found" });
            } else {
                await category.destroy();
                res.status(200).send({ message: "Category deleted successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error deleting category" });
        }
    }
}