import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./Components/Header";
import Home from "./Components/Home";
import About from "./Components/About";
import Service from "./Components/Service";
import Activity from "./Components/Activity";
import Contact from "./Components/Contact";
import Footer from "./Components/Footer";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import NotFound from "./pages/NotFound";

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
