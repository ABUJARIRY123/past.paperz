import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  linkedStudents: [],
  error: null,
  loading: false,
  previousUser: null // New state to store parent's info
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    signInStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    signInFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
    },
    deleteUserFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    signoutSuccess: (state) => {
      state.currentUser = null;
      state.linkedStudents = [];
      state.error = null;
      state.loading = false;
      state.previousUser = null;
    },
    signInSuccess: (state, action) => {
      state.currentUser = action.payload;
      state.linkedStudents = action.payload.children || [];
    },
    setLinkedStudents: (state, action) => {
      state.linkedStudents = action.payload;
    },
    switchStudentStart: (state) => {
      state.loading = true;
      // Store current parent user before switching
      if (state.currentUser?.role === 'Parent') {
        state.previousUser = state.currentUser;
      }
    },
    switchStudentSuccess: (state, action) => {
      state.currentUser = {
        ...action.payload,
        accountType: 'users',
        designation: null
      };
      state.loading = false;
    },
    switchStudentFailure: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      // Restore parent user if switch fails
      if (state.previousUser) {
        state.currentUser = state.previousUser;
      }
    },
    // New action to switch back to parent
    switchBackToParent: (state) => {
      if (state.previousUser) {
        state.currentUser = state.previousUser;
        state.previousUser = null;
      }
    }
  },
});

export const {
  switchStudentStart,
  switchStudentSuccess,
  switchStudentFailure,
  switchBackToParent,
  setLinkedStudents,
  signInStart,
  signInSuccess,
  signInFailure,
  updateStart,
  updateSuccess,
  updateFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  signoutSuccess,
} = userSlice.actions;

export default userSlice.reducer;