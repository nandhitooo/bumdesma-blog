import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./components/Home";
import About from "./components/About";
import Service from "./components/Service";
import Activity from "./components/Activity";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import NotFound from "./pages/NotFound";
import { SiteContentProvider } from "./lib/siteContent";

const CmsLanding = lazy(() => import("./pages/CmsLanding"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/Login"));
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const AdminArticles = lazy(() => import("./admin/Articles"));
const AdminArticleEditor = lazy(() => import("./admin/ArticleEditor"));
const AdminCategories = lazy(() => import("./admin/Categories"));
const AdminUsers = lazy(() => import("./admin/Users"));
const AdminSiteContent = lazy(() => import("./admin/SiteContent"));

const adminFallback = (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
    Memuat panel...
  </main>
);

const pageFallback = (
  <main className="flex min-h-[60vh] items-center justify-center bg-white text-gray-600">
    Memuat halaman...
  </main>
);

function App() {
  const location = useLocation();

  // Halaman panel admin tidak boleh muncul di hasil pencarian. Tag dibuat saat
  // berada di /admin dan dilepas lagi saat pengguna kembali ke halaman publik.
  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) return undefined;

    const tag = document.createElement("meta");
    tag.setAttribute("name", "robots");
    tag.setAttribute("content", "noindex");
    document.head.appendChild(tag);
    return () => tag.remove();
  }, [location.pathname]);

  return (
    <SiteContentProvider>
      <ScrollToTop />
      <ErrorBoundary resetKey={location.pathname}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Header />
                <main>
                  <Home />
                  <About />
                  <Service />
                  <Activity />
                  <Contact />
                </main>
                <Footer />
              </>
            }
          />
          <Route
            path="/blog"
            element={
              <>
                <Header />
                <BlogList />
                <Footer />
              </>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <>
                <Header />
                <BlogDetail />
                <Footer />
              </>
            }
          />
          <Route
            path="/cms"
            element={
              <>
                <Header />
                <Suspense fallback={pageFallback}>
                  <CmsLanding />
                </Suspense>
                <Footer />
              </>
            }
          />
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={adminFallback}>
                <AdminLogin />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={adminFallback}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/new" element={<AdminArticleEditor />} />
            <Route path="articles/:id/edit" element={<AdminArticleEditor />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="content" element={<AdminSiteContent />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </SiteContentProvider>
  );
}

export default App;
