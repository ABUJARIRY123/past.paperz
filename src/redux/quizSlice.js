import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define initial state type
const initialState = {
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null
};

// Async thunk for fetching quizzes
export const fetchQuizzes = createAsyncThunk(
  'quiz/fetchQuizzes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/quizzes');
      // Ensure response is an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Fetch quizzes error:', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch quizzes');
    }
  }
);

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    resetQuizState: (state) => {
      state.currentQuiz = null;
      state.loading = false;
      state.error = null;
      state.quizzes = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure quizzes is always an array
        state.quizzes = action.payload || [];
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
        state.quizzes = []; // Reset quizzes on error
      });
  },
});

export const { resetQuizState } = quizSlice.actions;
export default quizSlice.reducer;