/**
 * App – Root Component
 * ====================
 * Defines the route layout: Header + page content + footer.
 */

import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import GuidePage from "./pages/GuidePage";
import { Separator } from "./components/ui/separator";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/guide" element={<GuidePage />} />
        </Routes>
      </main>

      <Separator className="opacity-30" />
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>
          Powered by{" "}
          <a
            href="https://github.com/NREL/OpenOA"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary hover:underline underline-offset-2 transition-colors"
          >
            OpenOA
          </a>{" "}
          &middot; Built with FastAPI &amp; React
        </p>
      </footer>
    </div>
  );
}
