import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

// Presentational shell for the public site (navbar + content + footer).
// Session state is provided app-wide by SessionProvider; this layout doesn't
// need it, so it stays a pure component.
const MainLayout = ({ children }) => (
    <div className="flex flex-col min-h-screen w-full">
        <NavBar />
        <div className="flex flex-1">
            <main className="w-full flex-1">{children}</main>
        </div>
        <Footer />
    </div>
);

export default MainLayout;
