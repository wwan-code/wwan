import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import http from 'http';
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import connectSessionSequelize from 'connect-session-sequelize';
import rateLimit from 'express-rate-limit';
import sequelize from "./config/database.js";
import { initSocket } from './config/socket.js';
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import friendRoutes from './routes/friend.routes.js';
import categoryRoutes from "./routes/category.routes.js";
import genreRoutes from "./routes/genre.routes.js";
import countryRoutes from "./routes/country.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import seriesRoutes from "./routes/series.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import episodeRoutes from "./routes/episode.routes.js";
import followMovieRoutes from "./routes/followMovie.routes.js";
import watchHistoryRouter from "./routes/watchHistory.routes.js";
import commentReportRoutes from "./routes/commentReport.routes.js";
import ratingRouter from "./routes/rating.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import indexRouter from "./routes/index.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import watchlistRoutes from "./routes/watchlist.routes.js";
import gamificationRoutes from "./routes/gamification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import comicRoutes from "./routes/comic.routes.js";
import chapterRoutes from "./routes/chapter.routes.js";
import shopRoutes from './routes/shop.routes.js';
import collectionRoutes from "./routes/collection.routes.js";
import adminBadgeRoutes from "./routes/admin.badge.routes.js";
import adminCommentRoutes from './routes/admin.comment.routes.js';
import adminNotificationRoutes from "./routes/admin.notification.routes.js";

const app = express();

// Cấu hình Rate Limiter
// const generalApiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//     handler: (req, res, next, options) => {
//         res.status(options.statusCode).json({
//             message: "Quá nhiều yêu cầu được gửi từ IP này, vui lòng thử lại sau một lát."
//         });
//     },
//     message: {
//         status: 429,
//         message: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."
//     }
// });

// app.use('/api', generalApiLimiter);

const corsOptions = {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

// session
const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

const httpServer = http.createServer(app);
const io = initSocket(httpServer);

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Credentials", true);
    req.headers["socket-id"] = req.headers["socket-id"] || null;
    next();
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use('/api', friendRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/genres", genreRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api", seriesRoutes);
app.use("/api", sectionRoutes);
app.use("/api/admin/movies", movieRoutes);
app.use("/api", episodeRoutes);
app.use('/api', commentReportRoutes);
app.use('/api/follow-movie', followMovieRoutes);
app.use('/api/watch-history', watchHistoryRouter);
app.use('/api', ratingRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', indexRouter);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api', reportRoutes);
app.use('/api', comicRoutes);
app.use('/api', chapterRoutes);
app.use('/api', shopRoutes);
app.use('/api', adminCommentRoutes);
app.use('/api', adminNotificationRoutes);
app.use('/api', collectionRoutes);
app.use('/api', adminBadgeRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

export { app, httpServer };
