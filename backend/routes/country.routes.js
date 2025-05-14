import express from 'express';
import CountriesController from '../controllers/country.controller.js';
import authJwt from '../middlewares/authJwt.js';

const router = express.Router();
const countryController = new CountriesController();

router.post('/', authJwt.verifyToken, authJwt.isEditorOrAdmin, countryController.createCountry);

router.get('/', countryController.getAllCountries);

router.get('/:id', countryController.getCountryById);

router.put('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, countryController.updateCountry);

router.delete('/:id', authJwt.verifyToken, authJwt.isEditorOrAdmin, countryController.deleteCountry);

export default router;