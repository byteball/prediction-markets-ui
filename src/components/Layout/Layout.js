import { Footer } from "components/Footer/Footer";
import { Header } from "components/Header/Header";

export const Layout = ({ children }) => {

  return <div>
    <div className="container" style={{ minHeight: '100vh' }}>
      <Header />
      {children}
    </div>

    <div className="container">
      <Footer />
    </div>
  </div>
}