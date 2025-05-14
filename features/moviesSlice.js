import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Gọi API lấy danh sách phim
export const fetchMovies = createAsyncThunk("movies/fetchMovies", async () => {
  const response = await axios.get("/api/movies");
  return response.data;
});

const moviesSlice = createSlice({
  name: "movies",
  initialState: {
    movies: [],
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.movies = action.payload;
      })
      .addCase(fetchMovies.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default moviesSlice.reducer;
