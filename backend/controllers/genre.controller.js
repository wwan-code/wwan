import Genre from "../models/Genre.js";

export default class GenreController {
    // Create a new genre
    async createGenre(req, res) {
        try {
            const { title, slug } = req.body;
            const existing = await Genre.findOne({ where: { slug } });
            if (existing) {
                return res.status(400).json({ message: 'Thể loại đã tồn tại!!!' });
            }
            const genre = await Genre.create({ title, slug });
            res.status(201).send({ genre, message: "Genre created successfully" });
        } catch (error) {
            res.status(500).send(error);
        }
    }

    // Get all genres
    async getAllGenres(req, res) {
        try {
            const genres = await Genre.findAll();
            res.status(200).send(genres);
        } catch (error) {
            res.status(500).send({ message: "Error getting genres" });
        }
    }

    // Get a genre by ID
    async getGenreById(req, res) {
        try {
            const id = req.params.id;
            const genre = await Genre.findByPk(id);
            if (!genre) {
                res.status(404).send({ message: "Genre not found" });
            } else {
                res.status(200).send(genre);
            }
        } catch (error) {
            res.status(500).send({ message: "Error getting genre" });
        }
    }

    // Update a genre
    async updateGenre(req, res) {
        try {
            const id = req.params.id;
            const { title, description } = req.body;
            const genre = await Genre.findByPk(id);
            if (!genre) {
                res.status(404).send({ message: "Genre not found" });
            } else {
                genre.title = title;
                genre.description = description;
                await genre.save();
                res.status(200).send({ genre,message: "Genre updated successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error updating genre" });
        }
    }

    // Delete a genre
    async deleteGenre(req, res) {
        try {
            const id = req.params.id;
            const genre = await Genre.findByPk(id);
            if (!genre) {
                res.status(404).send({ message: "Genre not found" });
            } else {
                await genre.destroy();
                res.status(200).send({ message: "Genre deleted successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error deleting genre" });
        }
    }
}