import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPlayerPage from "./pages/SignupPlayerPage";
import SignupOrganizerPage from "./pages/SignupOrganizerPage";
import OrganizerPendingPage from "./pages/OrganizerPendingPage";
import DemoPage from "./pages/DemoPage";
import OurStoryPage from "./pages/OurStoryPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import OrganizerInfoPage from "./pages/organizer/OrganizerInfoPage";
import HelpPage from "./pages/HelpPage";

// Demo Pages
import OrganizerDemo from "./pages/demo/OrganizerDemo";
import PlayerDemo from "./pages/demo/PlayerDemo";
import ChatDemo from "./pages/demo/ChatDemo";

// Player Pages
import PlayerDashboard from "./pages/player/Dashboard";
import PlayerEvents from "./pages/player/Events";
import EventDetails from "./pages/player/EventDetails";
import PlayerBookings from "./pages/player/Bookings";
import PaymentPage from "./pages/player/Payment";
import SpecialRequestPage from "./pages/player/SpecialRequest";
import GroupPage from "./pages/player/GroupPage";
import MyGroups from "./pages/player/MyGroups";

// Organizer Pages
import OrganizerDashboard from "./pages/organizer/Dashboard";
import CreateEventPage from "./pages/organizer/CreateEvent";
import ManageEventPage from "./pages/organizer/ManageEvent";
import OrganizerSpecialRequests from "./pages/organizer/SpecialRequests";
import OrganizerBookings from "./pages/organizer/Bookings";
import OrganizerGroups from "./pages/organizer/Groups";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import PendingOrganizers from "./pages/admin/PendingOrganizers";
import AdminUsers from "./pages/admin/Users";
import AdminEvents from "./pages/admin/Events";
import SettingsPage from "./pages/SettingsPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup/player" element={<SignupPlayerPage />} />
            <Route path="/signup/organizer" element={<SignupOrganizerPage />} />
            <Route path="/signup/organizer/pending" element={<OrganizerPendingPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/demo/organizer" element={<OrganizerDemo />} />
            <Route path="/demo/player" element={<PlayerDemo />} />
            <Route path="/demo/chat" element={<ChatDemo />} />
            <Route path="/our-story" element={<OurStoryPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/organizer/info" element={<OrganizerInfoPage />} />
            <Route path="/help" element={<HelpPage />} />

            {/* Settings Route */}
            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            } />

            {/* Player Routes */}
            <Route path="/player/dashboard" element={
              <ProtectedRoute allowedRoles={['player']}><PlayerDashboard /></ProtectedRoute>
            } />
            <Route path="/player/events" element={<PlayerEvents />} />
            <Route path="/player/events/:id" element={<EventDetails />} />
            <Route path="/player/bookings" element={
              <ProtectedRoute allowedRoles={['player']}><PlayerBookings /></ProtectedRoute>
            } />
            <Route path="/player/payment/:timeslotId" element={
              <ProtectedRoute allowedRoles={['player']}><PaymentPage /></ProtectedRoute>
            } />
            <Route path="/player/special-request" element={
              <ProtectedRoute allowedRoles={['player']}><SpecialRequestPage /></ProtectedRoute>
            } />
            <Route path="/player/groups/:id" element={<GroupPage />} />
            <Route path="/player/groups" element={
              <ProtectedRoute allowedRoles={['player']}><MyGroups /></ProtectedRoute>
            } />

            {/* Organizer Routes */}
            <Route path="/organizer/dashboard" element={
              <ProtectedRoute><OrganizerDashboard /></ProtectedRoute>
            } />
            <Route path="/organizer/create-event" element={
              <ProtectedRoute><CreateEventPage /></ProtectedRoute>
            } />
            <Route path="/organizer/events/:id" element={
              <ProtectedRoute><ManageEventPage /></ProtectedRoute>
            } />
            <Route path="/organizer/special-requests" element={
              <ProtectedRoute><OrganizerSpecialRequests /></ProtectedRoute>
            } />
            <Route path="/organizer/bookings" element={
              <ProtectedRoute><OrganizerBookings /></ProtectedRoute>
            } />
            <Route path="/organizer/groups" element={
              <ProtectedRoute><OrganizerGroups /></ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/pending" element={
              <ProtectedRoute allowedRoles={['admin']}><PendingOrganizers /></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>
            } />
            <Route path="/admin/events" element={
              <ProtectedRoute allowedRoles={['admin']}><AdminEvents /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
