/**
 * Root Component: App
 * Description: Main application component that sets up routing and global providers.
 * Wraps the entire application with necessary context providers and routing configuration.
 * 
 * @returns {JSX.Element} The root application component with routing and providers
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Web3AuthProvider } from "@/contexts/Web3AuthContext";
import Index from "./pages/Index";
import ProjectDetails from "./pages/ProjectDetails";
import EditProject from "./pages/EditProject";
// import Auth from "./pages/Auth"; // No longer needed - Web3Auth modal triggered directly
import CreateProfile from "./pages/CreateProfile";
import UserProfile from "./pages/UserProfile";
import About from "./pages/About";
import Users from "./pages/Users";
import AdminUsers from "./pages/AdminUsers";
import AdminProjects from "./pages/AdminProjects";
import AdminMinting from "./pages/AdminMinting";
import NavBar from "./components/NavBar";
import { useState } from "react";
import ReRenderer from "./utils/reRenderer";

const queryClient = new QueryClient();



/**
 * Main application component that configures global providers and routing
 * 
 * @returns {JSX.Element} Configured application with routing and providers
 */
const App = () => {

  const [refresh, setRefresh] = useState(0);

  console.log('=== refresh === App.tsx === key: 359435 ===');
  console.dir(refresh, { depth: null, colors: true })
  console.log('=================================');

const forceRerender = () => {

  setRefresh(Math.random());
};

ReRenderer.initRenderer(forceRerender);

  return (

    <QueryClientProvider client={queryClient}>
      <Web3AuthProvider>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <NavBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/project/:idWithSlug" element={<ProjectDetails />} />
                <Route path="/project/:idWithSlug/edit" element={<EditProject />} />
                {/* Auth page removed - Web3Auth modal is triggered directly from UI */}
                {/* <Route path="/auth" element={<Auth />} /> */}
                <Route path="/create-profile" element={<CreateProfile />} />
                <Route path="/profile/:username" element={<UserProfile />} />
                <Route path="/about" element={<About />} />
                <Route path="/users" element={<Users />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/minting" element={<AdminMinting />} />
              </Routes>
            </div>
          </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </Web3AuthProvider>
    </QueryClientProvider>
  )
};

export default App;