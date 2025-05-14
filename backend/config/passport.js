import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: '589612591615-7bo64tvte988v19uu3q3qheo814g4mqk.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:5000/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ where: { googleId: profile.id } });
        if (!user) {
            const phoneNumber = profile.phoneNumbers && profile.phoneNumbers[0].value;
            user = await User.create({
                name: profile.displayName,
                phoneNumber,
                avatar: profile.photos[0].value,
                email: profile.emails[0].value,
                googleId: profile.id
            });
            await user.setRoles([3]);
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

export default passport;