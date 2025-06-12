// frontend/src/app/store.jsx
import { configureStore } from "@reduxjs/toolkit";
import moviesReducer from "../features/moviesSlice";
import userReducer from "../features/userSlice";
import friendReducer from "../features/friendSlice";
import notificationReducer from "../features/notificationSlice";

export const store = configureStore({
  reducer: {
    movies: moviesReducer,
    user: userReducer,
    friends: friendReducer,
    notifications: notificationReducer
  },
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    }),
});

export default store;