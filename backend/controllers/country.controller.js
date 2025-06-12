import Country from "../models/Country.js";

export default class CountryController {
    // Create a new country
    async createCountry(req, res) {
        try {
            const { title, slug } = req.body;
            const existingCountry = await Country.findOne({ where: { slug } });
            if (existingCountry) {
                return res.status(400).json({ error: 'Country already exists' });
            }
            const country = await Country.create({ title, slug });
            res.status(201).send({ country,message: "Country created successfully" });
        } catch (error) {
            res.status(500).send({ message: "Error creating country" });
        }
    }

    // Get all countries
    async getAllCountries(req, res) {
        try {
            const countries = await Country.findAll();
            res.status(200).send(countries);
        } catch (error) {
            res.status(500).send({ message: "Error getting countries" });
        }
    }

    // Get a country by ID
    async getCountryById(req, res) {
        try {
            const id = req.params.id;
            const country = await Country.findByPk(id);
            if (!country) {
                res.status(404).send({ message: "Country not found" });
            } else {
                res.status(200).send(country);
            }
        } catch (error) {
            res.status(500).send({ message: "Error getting country" });
        }
    }

    // Update a country
    async updateCountry(req, res) {
        try {
            const id = req.params.id;
            const { title, slug } = req.body;
            const country = await Country.findByPk(id);
            if (!country) {
                res.status(404).send({ message: "Country not found" });
            } else {
                country.title = title;
                country.slug = slug;
                await country.save();
                res.status(200).send({ country,message: "Country updated successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error updating country" });
        }
    }

    // Delete a country
    async deleteCountry(req, res) {
        try {
            const id = req.params.id;
            const country = await Country.findByPk(id);
            if (!country) {
                res.status(404).send({ message: "Country not found" });
            } else {
                await country.destroy();
                res.status(200).send({ message: "Country deleted successfully" });
            }
        } catch (error) {
            res.status(500).send({ message: "Error deleting country" });
        }
    }
}