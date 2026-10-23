import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashProfile from '../../components/DashProfile.jsx';
import StaffSidebar from './SideBar.jsx';
import RequestsDisplay from '../../requests/RequestsDisplay.jsx';
import Documentlibrary from '../../documents/Documentlibrary.jsx';
import Website from '../website/Website.jsx';
import AdminProgramsPage from '../website/programs/ProgramDisplay.jsx';
import BookingEntry from '../../booking/BookingEntry.jsx'
import BookingsDasboard from '../../booking/BookingsDasboard.jsx'
import Categories from '../../categories/Categories.jsx';
import CustomersPage from '../../customers/CustomersPage.jsx';
import PublicChat, { usePublicChatUnread } from '../../chat/PublicChat.jsx';
import PoliciesPage from '../../policies/PoliciesPage.jsx'
import Papers from '../../papers/Papers.jsx'
import FavouritesPage from '../../papers/FavouritesPage.jsx'
import ComingSoonPage from './ComingSoonPage.jsx'
import DiamondApprovals  from "../../diamonds/DiamondApprovals";
import DiamondWallets  from "../../diamonds/DiamondWallets";


export default function SideBarItems() {
  const location = useLocation();
  const [tab, setTab] = useState('');

  // Tracks which conversation (if any) is currently open in the thread
  // modal, so usePublicChatUnread can suppress the ping for a thread the
  // agent is already looking at.
  const [openConversationId, setOpenConversationId] = useState(null);

  const sidebarCollapsed = useSelector(
    (state) => state.theme?.sidebarCollapsed ?? false
  );

  // Lives here — not inside PublicChat — so the list, its realtime
  // subscription, and the unread count keep running no matter which tab
  // is showing, not just while the "chats" tab happens to be active.
  // 'chats' below must match the tab value used for Chats in the sidebar
  // NavLink (?tab=chats), since that's what the ping-suppression check
  // compares against.
  const {
    conversations,
    setConversations,
    loading: chatsLoading,
    error: chatsError,
    refresh: refreshChats,
    unreadTotal, // <-- was being computed by the hook and dropped on the floor before
  } = usePublicChatUnread({ activeTab: tab, openConversationId, PublicChatId: 'chats' });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabFromUrl = urlParams.get('tab');
    if (tabFromUrl) setTab(tabFromUrl);
  }, [location.search]);

  return (
    <div className="min-h-screen flex flex-row">

      {/* ── Render the sidebar (it positions itself as fixed) ──
          chatUnreadCount is the only new prop — it's what lights up the
          badge next to "Chats" in Sidebar.jsx. */}
      <StaffSidebar chatUnreadCount={unreadTotal} />

      {/*
        ── Spacer: pushes main content rightward to avoid being hidden
           under the fixed sidebar. Matches sidebar width exactly.
           Hidden on mobile (sidebar overlays there instead).
      ── */}
      <div
        className="hidden md:block flex-shrink-0 transition-all duration-300"
        style={{ width: sidebarCollapsed ? 68 : 240 }}
        aria-hidden="true"
      />

      {/* ── Main content — fills remaining width ── */}
      <main className="flex-1 min-w-0 transition-all duration-300">
        {tab === 'orgresorsrepo' && <ResourceTab />}



        {tab === 'profile'            && <DashProfile />}

                {tab === 'documentsrepo'             && <Documentlibrary />}
        {/* {tab === 'website'             && <Website />} */}
                {tab === 'programsedit'             && <AdminProgramsPage />}
                                {tab === 'bookings'             && <BookingEntry />}
                   {tab === 'currentbookings'             && <BookingsDasboard />}
                   {tab === 'customers'             && <CustomersPage />}
                   {tab === 'chats'             && (
                     <PublicChat
                       conversations={conversations}
                       setConversations={setConversations}
                       loading={chatsLoading}
                       error={chatsError}
                       onRefresh={refreshChats}
                       onOpenConversation={setOpenConversationId}
                     />
                   )}


        {tab === 'policies'             && <PoliciesPage />}


        {tab === 'papers'             && <Papers />}
        {tab === 'favourites'             && <FavouritesPage />}
        {tab === 'requests'             && <ComingSoonPage />}
        {tab === 'diamonds'             && <DiamondWallets />}
                {tab === 'payments'             && <DiamondApprovals />}
        {tab === 'examgen'             && <ComingSoonPage />}


      </main>
    </div>
  );
}