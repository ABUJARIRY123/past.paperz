import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light',
  sidebarOpen: false,       // mobile drawer open/closed
  sidebarCollapsed: false,  // desktop sidebar collapsed/expanded
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    // Mobile: open/close the drawer
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    // Desktop: collapse/expand the sidebar
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const {
  toggleTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
} = themeSlice.actions;

export default themeSlice.reducer;