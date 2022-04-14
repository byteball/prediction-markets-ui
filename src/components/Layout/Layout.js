import { Header } from "components/Header/Header";


export const Layout = ({ children }) => {
  return <div>
    <Header />
    <div className="container">
      {children}
    </div>
  </div>
}