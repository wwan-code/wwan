  // models/index.js
import sequelize from '../config/database.js'; // Import instance sequelize
import { Sequelize } from 'sequelize';

// Import tất cả models
import User from './User.js';
import Session from './Session.js';
import Role from './Role.js';
import Verification from './Verification.js';
import Comment from './Comment.js';
import WatchHistory from './WatchHistory.js';
import CommentReport from './CommentReport.js';
import FollowMovie from './FollowMovie.js';
import Favorite from './Favorite.js';
import Friend from './Friend.js';
import Movie from './Movie.js';
import Notification from './Notification.js';
import Episode from './Episode.js';
import Section from './Section.js';
import Series from './Series.js';
import Category from './Category.js';
import Country from './Country.js';
import Genre from './Genre.js';
import Rating from './Rating.js';
import Watchlist from './Watchlist.js';
import WatchlistMovie from './WatchlistMovie.js';
import Badge from './Badge.js';
import UserBadge from './UserBadge.js';
import ContentReport from './ContentReport.js';
import Comic from './Comic.js';
import Chapter from './Chapter.js';
import ComicPage from './ComicPage.js';
import ComicGenre from './ComicGenre.js';
import ShopItem from './ShopItem.js';
import UserInventory from './UserInventory.js';
import WatchlistComic from './WatchlistComic.js';
import ComicViewDaily from './ComicViewDaily.js';
import UserComicHistory from './UserComicHistory.js';

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = User;
db.Session = Session;
db.Role = Role;
db.Verification = Verification;
db.Comment = Comment;
db.WatchHistory = WatchHistory;
db.CommentReport = CommentReport;
db.FollowMovie = FollowMovie;
db.Favorite = Favorite;
db.Friend = Friend;
db.Notification = Notification;
db.Movie = Movie;
db.Episode = Episode;
db.Section = Section;
db.Series = Series;
db.Category = Category;
db.Country = Country;
db.Genre = Genre;
db.Rating = Rating;
db.Watchlist = Watchlist;
db.WatchlistMovie = WatchlistMovie;
db.Badge = Badge;
db.UserBadge = UserBadge; 
db.ContentReport = ContentReport;
db.Comic = Comic;
db.ComicPage = ComicPage;
db.Chapter = Chapter;
db.ComicGenre = ComicGenre;
db.ShopItem = ShopItem;
db.UserInventory = UserInventory;
db.WatchlistComic = WatchlistComic;
db.ComicViewDaily = ComicViewDaily;
db.UserComicHistory = UserComicHistory;

Role.belongsToMany(User, { through: "user_roles", foreignKey: 'roleId', otherKey: 'userId' });
User.belongsToMany(Role, { through: "user_roles", foreignKey: 'userId', otherKey: 'roleId', as: 'roles' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });

User.hasMany(WatchHistory, { foreignKey: 'userId' });
WatchHistory.belongsTo(User, { foreignKey: 'userId' });
Episode.hasMany(WatchHistory, { foreignKey: 'episodeId' });
WatchHistory.belongsTo(Episode, { foreignKey: 'episodeId' });

User.hasMany(CommentReport, { foreignKey: 'userId' });
CommentReport.belongsTo(User, { foreignKey: 'userId' });
Comment.hasMany(CommentReport, { foreignKey: 'commentId' });
CommentReport.belongsTo(Comment, { foreignKey: 'commentId' });

User.hasMany(FollowMovie, { foreignKey: 'userId' });
FollowMovie.belongsTo(User, { foreignKey: 'userId' });
Movie.hasMany(FollowMovie, { foreignKey: 'movieId', as: 'follow_movies' });
FollowMovie.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });
Episode.hasMany(Favorite, { foreignKey: 'episodeId', as: 'favoritedBy' });
Favorite.belongsTo(Episode, { foreignKey: 'episodeId' });
Movie.hasMany(Favorite, { foreignKey: 'movieId' });
Favorite.belongsTo(Movie, { foreignKey: 'movieId' });

User.belongsToMany(User, {
    as: 'Friends',
    through: Friend,
    foreignKey: 'userId',
    otherKey: 'friendId'
});
User.belongsToMany(User, {
    as: 'FriendOf',
    through: Friend,
    foreignKey: 'friendId',
    otherKey: 'userId'
});
User.hasMany(Friend, { foreignKey: 'userId', as: 'initiatedFriendships' });
User.hasMany(Friend, { foreignKey: 'friendId', as: 'receivedFriendships' });
Friend.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Friend.belongsTo(User, { as: 'friend', foreignKey: 'friendId' });

User.hasMany(Notification, { foreignKey: 'recipientId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

Genre.belongsToMany(Movie, { through: 'movie_genres' });
Movie.belongsToMany(Genre, { through: 'movie_genres' });
Country.hasMany(Movie, { foreignKey: 'countryId' });
Movie.belongsTo(Country, { foreignKey: 'countryId', as: 'countries' });
Category.hasMany(Movie, { foreignKey: 'categoryId' });
Movie.belongsTo(Category, { foreignKey: 'categoryId', as: 'categories' });

Movie.hasMany(Episode, { foreignKey: 'movieId' });
Episode.belongsTo(Movie, { foreignKey: 'movieId' });

Movie.hasOne(Section, { foreignKey: 'movieId', as: 'sections' });
Section.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

Series.hasMany(Movie, { foreignKey: "seriesId", as: "movies" });
Movie.belongsTo(Series, { foreignKey: 'seriesId', as: 'series' });

Movie.hasMany(Rating, { foreignKey: 'movieId', as: 'ratings' });
Rating.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' })
User.hasMany(Rating, { foreignKey: 'userId', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Watchlist, { foreignKey: 'userId', as: 'watchlists' });
Watchlist.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Watchlist.belongsToMany(Movie, {
    through: WatchlistMovie,
    foreignKey: 'watchlistId',
    otherKey: 'movieId',
    as: 'movies'
});
Movie.belongsToMany(Watchlist, {
    through: WatchlistMovie,
    foreignKey: 'movieId',
    otherKey: 'watchlistId',
    as: 'watchlists'
});

Movie.hasMany(WatchlistMovie, { foreignKey: 'movieId', as: 'watchlist_movies' });
WatchlistMovie.belongsTo(Movie, { foreignKey: 'movieId', as: 'movie' });

Watchlist.belongsToMany(Comic, {
    through: WatchlistComic,
    foreignKey: 'watchlistId',
    otherKey: 'comicId',
    as: 'comics'
});
Comic.belongsToMany(Watchlist, {
    through: WatchlistComic,
    foreignKey: 'comicId',
    otherKey: 'watchlistId',
    as: 'watchlistsContainingComic'
});
Comic.hasMany(WatchlistComic, { foreignKey: 'comicId', as: 'watchlist_comics' });
WatchlistComic.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

User.belongsToMany(Badge, {
    through: UserBadge,
    foreignKey: 'userId',
    otherKey: 'badgeId',
    as: 'badges'
});
Badge.belongsToMany(User, {
    through: UserBadge,
    foreignKey: 'badgeId',
    otherKey: 'userId',
    as: 'users'
});

User.hasMany(ContentReport, { foreignKey: 'userId', as: 'reportsMade' });
ContentReport.belongsTo(User, { foreignKey: 'userId', as: 'reporter' });

Movie.hasMany(ContentReport, { foreignKey: 'movieId', as: 'reports' });
ContentReport.belongsTo(Movie, { foreignKey: 'movieId', as: 'reportedMovie' });

Episode.hasMany(ContentReport, { foreignKey: 'episodeId', as: 'reports' });
ContentReport.belongsTo(Episode, { foreignKey: 'episodeId', as: 'reportedEpisode' });

Comic.hasMany(Chapter, { foreignKey: 'comicId', as: 'chapters', onDelete: 'CASCADE' });
Chapter.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

Chapter.hasMany(ComicPage, { foreignKey: 'chapterId', as: 'pages', onDelete: 'CASCADE' });
ComicPage.belongsTo(Chapter, { foreignKey: 'chapterId', as: 'chapter' });

Comic.belongsToMany(Genre, {
    through: ComicGenre,
    foreignKey: 'comicId',
    otherKey: 'genreId',
    as: 'genres'
});
Genre.belongsToMany(Comic, {
    through: ComicGenre,
    foreignKey: 'genreId',
    otherKey: 'comicId',
    as: 'comicsInGenre'
});

Comic.belongsTo(Country, { foreignKey: 'countryId', as: 'country' });
Country.hasMany(Comic, { foreignKey: 'countryId', as: 'comicsInCountry' });

Comic.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Comic, { foreignKey: 'categoryId', as: 'comicsInCategory' });

User.belongsToMany(Comic, { through: 'user_followed_comics', as: 'followedComics' });
Comic.belongsToMany(User, { through: 'user_followed_comics', as: 'followers' });

User.hasMany(UserInventory, { foreignKey: 'userId', as: 'inventory' });
UserInventory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ShopItem.hasMany(UserInventory, { foreignKey: 'shopItemId', as: 'inventoryEntries' });
UserInventory.belongsTo(ShopItem, { foreignKey: 'shopItemId', as: 'itemDetails' });

User.hasMany(UserComicHistory, { foreignKey: 'userId', as: 'comicHistories' });
UserComicHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comic.hasMany(UserComicHistory, { foreignKey: 'comicId', as: 'userHistories' });
UserComicHistory.belongsTo(Comic, { foreignKey: 'comicId', as: 'comic' });

Chapter.hasMany(UserComicHistory, { foreignKey: 'lastChapterId', as: 'userComicHistories' });
UserComicHistory.belongsTo(Chapter, { foreignKey: 'lastChapterId', as: 'lastChapter' });

export default db;