import { configureStore } from '@reduxjs/toolkit';
import quizReducer from '../quizSlice';

const store = configureStore({
  reducer: {
    quiz: quizReducer,
  },
  // Add this to help with undefined state issues
  preloadedState: {
    quiz: {
      quizzes: [],
      loading: false,
      error: null,
      currentQuiz: null
    }
  }
});

export default store;