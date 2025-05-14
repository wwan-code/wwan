// store.js
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
    notifications: notificationReducer,
  },
  devTools: true,
});

export default store;