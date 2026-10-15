import Header from "./Components/Header";
import Home from "./Components/Home";
import About from "./Components/About";
import Service from "./Components/Service";
import Activity from "./Components/Activity";
import Contact from "./Components/Contact";
import Footer from "./Components/Footer";

function App() {
  return (
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
  );
}

export default App;
