import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Blog from "./pages/Blog";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Adhesion from "./pages/Adhesion";
import DashboardHome from "./pages/dashboard/DashboardHome";
import AIAssistant from "./pages/dashboard/AIAssistant";
import Documents from "./pages/dashboard/Documents";
import Resources from "./pages/dashboard/Resources";
import Subscription from "./pages/dashboard/Subscription";
import Settings from "./pages/dashboard/Settings";
import Adhesions from "./pages/dashboard/Adhesions";
import Members from "./pages/dashboard/Members";
import Community from "./pages/dashboard/Community";
import Messages from "./pages/dashboard/Messages";
import Cases from "./pages/dashboard/Cases";
import OnboardingPage from "./pages/dashboard/Onboarding";
import DashboardArticles from "./pages/dashboard/Articles";
import DashboardArticleDetail from "./pages/dashboard/ArticleDetail";
import SSOCallback from "./pages/SSOCallback";
// Admin imports
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminHelloAsso from "./pages/admin/AdminHelloAsso";
import AdminMemberships from "./pages/admin/AdminMemberships";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminCohesion from "./pages/admin/AdminCohesion";
import AdminAI from "./pages/admin/AdminAI";
import AdminTestAgent from "./pages/admin/AdminTestAgent";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminChat from "./pages/admin/AdminChat";
import AdminAdhesionLogs from "./pages/admin/AdminAdhesionLogs";
import BlogArticle from "./pages/BlogArticle";
import ChatAIWidget from "./components/ChatAIWidget";
import AnalyticsTracker from "./components/AnalyticsTracker";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Fonction pour déterminer le type d'utilisateur pour le chat IA
const getUserTypeForChat = () => {
  const token = localStorage.getItem('token');
  if (!token) return 'visitor';
  
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') return 'admin';
  if (userRole === 'vip') return 'vip';
  return 'member';
};

// Public routes with Navbar and Footer
const PublicLayout = ({ children }) => {
  const userType = getUserTypeForChat();
  
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ChatAIWidget userType={userType} />
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AnalyticsTracker />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
          <Route path="/blog/:slug" element={<PublicLayout><BlogArticle /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/adhesion" element={<PublicLayout><Adhesion /></PublicLayout>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/sso/callback" element={<SSOCallback />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/ai"
            element={
              <ProtectedRoute>
                <AIAssistant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/adhesions"
            element={
              <ProtectedRoute>
                <Adhesions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/members"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/cases"
            element={
              <ProtectedRoute>
                <Cases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/articles"
            element={
              <ProtectedRoute>
                <DashboardArticles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/articles/:slug"
            element={
              <ProtectedRoute>
                <DashboardArticleDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminMembers /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/helloasso"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminHelloAsso /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/adhesion-logs"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminAdhesionLogs /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminHelloAsso /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/adhesions"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminMemberships /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blog"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminBlog /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/test-agent"
            element={
              <ProtectedRoute>
                <AdminTestAgent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminAnalytics /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/chat"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminChat /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cohesion"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminCohesion /></AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai"
            element={
              <ProtectedRoute>
                <AdminLayout><AdminAI /></AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
