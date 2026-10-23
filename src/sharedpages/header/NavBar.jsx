import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { signoutSuccess } from '../../redux/user/userSlice';
import { FaMoon, FaSun } from 'react-icons/fa';
import { HiMenu } from 'react-icons/hi';
import { toggleTheme, toggleSidebar, toggleSidebarCollapsed } from '../../redux/theme/themeSlice';
import { supabase } from '../../supabaseClient';
import { DASHBOARD_BY_ROLE } from '../../components/roles';

const DEFAULT_AVATAR =
  'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const alertTimer = useRef(null);
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.theme);

  // Single HiMenu button: on mobile it toggles the drawer,
  // on desktop it toggles the collapsed state.
  const handleMenuClick = () => {
    if (window.innerWidth >= 768) {
      dispatch(toggleSidebarCollapsed());
    } else {
      dispatch(toggleSidebar());
    }
  };

  const showAlert = (message, type) => {
    clearTimeout(alertTimer.current);
    setAlert({ show: true, message, type });
    alertTimer.current = setTimeout(
      () => setAlert({ show: false, message: '', type: '' }),
      3000
    );
  };

  // Clear any pending alert timer on unmount
  useEffect(() => () => clearTimeout(alertTimer.current), []);

  const handleSignout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log(error.message);
      showAlert('Failed to sign out, try again.', 'failure');
      return;
    }
    // App.jsx's onAuthStateChange also clears the store; dispatching here
    // just makes the UI update immediately.
    dispatch(signoutSuccess());
    showAlert('Signed out successfully!', 'success');
    navigate('/sign-in');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Every role has its own dashboard base path; profile / notice board are tabs on it.
  const basePath = DASHBOARD_BY_ROLE[currentUser?.role];
  const profileLink = basePath ? `${basePath}?tab=profile` : null;

  const displayName = currentUser?.full_name || currentUser?.email;

  return (
    <div className="fixed w-full top-0 z-50 navbar-container">
      <div
        className="
          shadow-lg w-full flex flex-col fixed top-0
          transition-colors duration-500 ease-in-out
          bg-white dark:bg-black
          border-b-2 border-green-600 dark:border-green-500
          text-gray-900 dark:text-white
        "
      >
        <div className="container mx-auto flex items-center justify-between py-3 px-4">

          {/* Hamburger */}
          <button
            onClick={handleMenuClick}
            aria-label="Toggle sidebar"
            className="
              flex items-center justify-center
              w-10 h-10 rounded-lg flex-shrink-0
              text-gray-600 dark:text-gray-300
              hover:bg-green-50 dark:hover:bg-green-900/30
              hover:text-green-700 dark:hover:text-green-400
              transition-colors duration-200
            "
          >
            <HiMenu className="w-6 h-6" />
          </button>

          {/* Alert */}
          <div className="fixed top-4 right-4 z-50">
            {alert.show && (
              <div
                className={`
                  px-4 py-2 rounded-lg shadow-md text-sm font-medium
                  ${alert.type === 'success'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-red-100 text-red-800 border border-red-300'}
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{alert.message}</span>
                  <button
                    onClick={() => setAlert({ ...alert, show: false })}
                    className="text-lg leading-none opacity-70 hover:opacity-100"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right-side controls */}
          <div className="flex gap-3 items-center">

            {/* Theme toggle */}
            <button
              onClick={() => dispatch(toggleTheme())}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="
                p-2 rounded-full
                text-gray-700 dark:text-gray-300
                hover:bg-green-50 dark:hover:bg-green-900/30
                hover:text-green-700 dark:hover:text-green-400
                transition-colors duration-200
              "
            >
              {theme === 'light' ? <FaMoon size={18} /> : <FaSun size={18} />}
            </button>

            {/* Avatar dropdown or Sign-In */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-label="Open user menu"
                  className="ring-2 ring-green-500 dark:ring-green-400 rounded-full p-0.5"
                >
                  <img
                    src={currentUser.profile_picture || DEFAULT_AVATAR}
                    alt="user"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="
                      absolute right-0 mt-2 w-56 rounded-lg shadow-lg
                      bg-white dark:bg-gray-900
                      border border-gray-200 dark:border-gray-700
                      py-1 z-50
                    "
                  >
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      {currentUser.full_name && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                          {currentUser.email}
                        </span>
                      )}
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        {currentUser.role}
                      </span>
                    </div>

                    {profileLink && (
                      <Link
                        to={profileLink}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        Profile
                      </Link>
                    )}


                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSignout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-green-50 dark:hover:bg-green-900/30"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="
                  px-4 py-2 rounded-lg text-sm font-semibold
                  border border-green-600 text-green-700
                  hover:bg-green-50
                  dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/30
                  transition-colors duration-200
                "
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Thin decorative green underline */}
        <div className="h-[3px] w-full bg-gradient-to-r from-green-700 via-green-500 to-green-700 dark:from-green-600 dark:via-green-400 dark:to-green-600" />
      </div>
    </div>
  );
};

export default Navbar;