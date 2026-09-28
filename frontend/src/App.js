import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth";
import Layout from "./components/Layout";
import { Home, HowItWorks, WhoItsFor, Sample, FAQ, About, Contact, Checklist, Legal } from "./pages/Marketing";
import { AuditPage, ProofPackPage, BidDeskPage, StartPage } from "./pages/Products";
import { Login, Signup, PaymentSuccess, PaymentCancel, ClientPortal, ClientOrderDetail } from "./pages/Portal";
import { AdminPortal, AdminOrderDetail } from "./pages/Admin";
import { AdminProofPages, AdminProofPageEdit } from "./pages/AdminProof";
import PublicProof from "./pages/Public";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/proof-pack" element={<ProofPackPage />} />
            <Route path="/bid-desk" element={<BidDeskPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/who-its-for" element={<WhoItsFor />} />
            <Route path="/sample" element={<Sample />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/legal/terms" element={<Legal kind="terms" />} />
            <Route path="/legal/privacy" element={<Legal kind="privacy" />} />
            <Route path="/legal/disclaimer" element={<Legal kind="disclaimer" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/app" element={<ClientPortal />} />
            <Route path="/app/order/:id" element={<ClientOrderDetail />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/admin/order/:id" element={<AdminOrderDetail />} />
            <Route path="/admin/proof-pages" element={<AdminProofPages />} />
            <Route path="/admin/proof-pages/:slug" element={<AdminProofPageEdit />} />
            <Route path="/p/:slug" element={<PublicProof />} />
            <Route path="*" element={<div className="section container-doc"><h1 className="text-3xl font-bold uppercase">404</h1><p className="mt-2">Page not found.</p></div>} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
