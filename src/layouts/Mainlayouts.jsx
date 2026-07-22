import React, { useContext } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

// Handling potential missing context file or export issues
import * as SessionModule from "../contexts/SessionContext";
const SessionContext = SessionModule?.SessionContext || SessionModule?.default;

const MainLayout = ({ children }) => {
    const context = SessionContext ? useContext(SessionContext) : null;
    const session = context ? context.session : null;

    return (
        <div className="flex flex-col min-h-screen w-full">
            <NavBar />
            <div className="flex flex-1">
                {/* Main content adjusts margin for sidebar on md+ screens */}
                <main className="w-full flex-1 md:ml-0\">{children}</main>
            </div>
            <Footer />
        </div>
    );
};

export default MainLayout;