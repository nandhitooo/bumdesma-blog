import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import About from "./components/About";
import Service from "./components/Service";
import Activity from "./components/Activity";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import NotFound from "./pages/NotFound";

const CmsLanding = lazy(() => import("./pages/CmsLanding"));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/Login"));
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const AdminArticles = lazy(() => import("./admin/Articles"));
const AdminArticleEditor = lazy(() => import("./admin/ArticleEditor"));
const AdminCategories = lazy(() => import("./admin/Categories"));
const AdminUsers = lazy(() => import("./admin/Users"));

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
  return (
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
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
