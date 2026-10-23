// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { supabase } from './supabaseClient';
import { signInSuccess, signoutSuccess } from './redux/user/userSlice';

import SignIn from './sharedpages/signin/SignIn';
import SignUp from './sharedpages/signin/SignUp';
import ForgotPassword from './sharedpages/signin/ForgotPassword';
import ResetPassword from './sharedpages/signin/ResetPassword';
import RoleRoute from './components/RoleRoute';
import SideBarItems from './sharedpages/sidebar/SideBarItems';
import NotFound from './sharedpages/404';
import Navbar from './sharedpages/header/NavBar';
import Spinner from './Spinner';

// ── Wrapper: conditionally shows the inner Navbar ─────────────────────────────
function AppContent() {
  const location = useLocation();

  const hiddenNavbarRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/pricing',
  ];
  const shouldShowNavbar = !hiddenNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        {/* ── Auth (public) ── */}
        <Route path="/"                element={<SignIn />} />
        <Route path="/sign-in"         element={<SignIn />} />
        <Route path="/sign-up"         element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Protected: one dashboard per role ── */}
        <Route element={<RoleRoute allowedRoles={['free']} />}>
          <Route path="/dashboard" element={<SideBarItems />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['member']} />}>
          <Route path="/memberdashboard" element={<SideBarItems />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['premium']} />}>
          <Route path="/premiumdashboard" element={<SideBarItems />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={['sysadmin']} />}>
          <Route path="/sysadmin" element={<SideBarItems />} />
        </Route>

        {/* ── Misc ── */}
        <Route path="/notfound" element={<NotFound />} />
        <Route path="*"         element={<NotFound />} />
      </Routes>
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  // Restore + keep in sync with the Supabase session
  useEffect(() => {
    let active = true;

    const syncProfile = async (session) => {
      if (!session) {
        dispatch(signoutSuccess());
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', session.user.id)
        .single();

      if (!active) return;
      if (error || !data) dispatch(signoutSuccess());
      else dispatch(signInSuccess(data));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer: calling supabase inside this callback can deadlock
      setTimeout(async () => {
        if (event === 'TOKEN_REFRESHED') return; // profile unchanged
        await syncProfile(session);
        if (active) setLoading(false);
      }, 0);
    });

    // Safety net so the spinner can never hang forever
    const fallback = setTimeout(() => active && setLoading(false), 5000);

    return () => {
      active = false;
      clearTimeout(fallback);
      sub.subscription.unsubscribe();
    };
  }, [dispatch]);

  if (loading) return <Spinner />;

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}