import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Menu, X } from "lucide-react";

const NAV = [
  { to: "/audit", label: "Audit" },
  { to: "/proof-pack", label: "Proof Pack" },
  { to: "/bid-desk", label: "Bid Desk" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/sample", label: "Sample" },
  { to: "/faq", label: "FAQ" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 ink-border bg-[color:var(--paper)] sticky top-0 z-50" data-testid="site-header">
        <div className="container-doc flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-link">
            <div className="w-10 h-10 border-2 ink-border flex items-center justify-center bg-[color:var(--gulf)] text-[color:var(--paper)] font-mono font-bold">LIR</div>
            <div>
              <div className="font-sans font-bold text-sm sm:text-base tracking-tight uppercase leading-none">Louisiana Industrial<br/>Readiness</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} data-testid={`nav-${n.to.slice(1)}`}
                className={"text-sm font-medium uppercase tracking-wide hover:text-[color:var(--gulf)] " + (loc.pathname===n.to ? "text-[color:var(--gulf)]" : "text-[color:var(--ink)]")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {user && user.role ? (
              <>
                <Link to={user.role === "admin" ? "/admin" : "/app"} className="text-sm font-medium uppercase tracking-wide" data-testid="portal-link">{user.role==="admin" ? "Admin" : "Portal"}</Link>
                <button onClick={logout} className="text-sm font-medium uppercase tracking-wide" data-testid="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="login-link" className="text-sm font-medium uppercase tracking-wide">Sign In</Link>
                <Link to="/audit" data-testid="cta-header-audit" className="btn-primary">Start Audit</Link>
              </>
            )}
          </div>
          <button className="lg:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-btn">
            {open ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t ink-border bg-[color:var(--card)]" data-testid="mobile-menu">
            <div className="container-doc py-4 flex flex-col gap-3">
              {NAV.map(n => <Link key={n.to} to={n.to} onClick={()=>setOpen(false)} className="text-sm uppercase font-medium py-1">{n.label}</Link>)}
              {user && user.role ? (
                <>
                  <Link to={user.role==="admin"?"/admin":"/app"} onClick={()=>setOpen(false)} className="text-sm uppercase font-medium py-1">{user.role==="admin"?"Admin":"Portal"}</Link>
                  <button onClick={()=>{ logout(); setOpen(false); }} className="text-left text-sm uppercase font-medium py-1">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={()=>setOpen(false)} className="text-sm uppercase font-medium py-1">Sign In</Link>
                  <Link to="/audit" onClick={()=>setOpen(false)} className="btn-primary w-fit">Start Audit</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t-2 ink-border bg-[color:var(--paper-alt)] mt-16" data-testid="site-footer">
        <div className="container-doc py-10 grid md:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="font-sans font-bold uppercase tracking-tight mb-3">Louisiana Industrial Readiness</div>
            <p className="text-[color:var(--ink-muted)] leading-relaxed">A Louisiana research and document-packaging practice. We make existing Louisiana operating companies easier to qualify.</p>
            <p className="meta-label mt-3">hello@laindustrialready.com</p>
            <p className="meta-label">Louisiana, USA</p>
          </div>
          <div>
            <div className="font-sans font-bold uppercase tracking-tight mb-3">Services</div>
            <ul className="space-y-1">
              <li><Link to="/audit">48-Hour Audit — $249</Link></li>
              <li><Link to="/proof-pack">Industrial Proof Pack — $995</Link></li>
              <li><Link to="/bid-desk">Bid Invite Response Desk</Link></li>
              <li><Link to="/checklist">Free Prequal Checklist</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-sans font-bold uppercase tracking-tight mb-3">Company</div>
            <ul className="space-y-1">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/legal/terms">Terms</Link></li>
              <li><Link to="/legal/privacy">Privacy</Link></li>
              <li><Link to="/legal/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t hairline">
          <div className="container-doc py-6 space-y-2 text-xs text-[color:var(--ink-muted)]" data-testid="footer-disclaimers">
            <p>Not affiliated with SpaceX, Tesla, xAI, NASA, LED, or the State of Louisiana.</p>
            <p>We do not place workers, award contracts, or submit bids on your behalf unless separately agreed in writing.</p>
            <p>Nothing on this site is legal, insurance, engineering, or estimating advice.</p>
            <p>© {new Date().getFullYear()} Louisiana Industrial Readiness.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
