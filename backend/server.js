import { httpServer } from "./app.js";
import sequelize from "./config/database.js";
import logger from "./utils/logger.js";
import db from './models/index.js';
import dotenv from "dotenv";
dotenv.config();

const startServer = async () => {
    try {
        // { alter: true }
        await sequelize.authenticate();
        console.log('✅ Kết nối MySQL thành công.');

        const PORT = process.env.PORT || 5000;

        db.sequelize.sync({ /* alter: true */ })
            .then(() => {
                console.log("Database synchronized");
                httpServer.listen(PORT, () => {
                    console.log(`Server is running on port ${PORT}`);
                });
            })
            .catch(err => {
                console.error("Failed to synchronize database:", err);
            });

    } catch (err) {
        logger.error('Error connecting to database:', err);
    }
};

startServer();