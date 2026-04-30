import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/wallet";
import { Layout } from "@/components/Layout";
import Home from "./pages/Home";
import CreateSplit from "./pages/CreateSplit";
import MySplits from "./pages/MySplits";
import SplitDetail from "./pages/SplitDetail";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <WalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateSplit />} />
            <Route path="/splits" element={<MySplits />} />
            <Route path="/split/:id" element={<SplitDetail />} />
            <Route path="/how" element={<HowItWorks />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </WalletProvider>
);

export default App;
