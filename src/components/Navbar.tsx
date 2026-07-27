"use client";
import LoginModal from "@/components/LoginModal";
import NotificationsBell from "@/components/NotificationsBell";
import { useAuth } from "@/context/AuthContext";
import { useHasPermission } from "@/lib/permissions";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = {
  name: string;
  href?: string;
  onClick?: () => void;
};

export default function Navbar() {
  const { role, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [showLogin, setShowLogin] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  /* The EasyCoders / EasyAssess app downloads now live in the floating
   * right-edge <AppDownloadDock /> (mounted in app/providers.tsx), so the
   * old navbar "Get the App" pills + Android-only note popovers were removed.
   * The navbar course-search box was removed in favour of the Gallery link;
   * search still lives on the /courses page itself. */

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setIsOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const commonLinks: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Courses", href: "/courses" },
    { name: "Gallery", href: "/gallery" },
    { name: "About Us", href: "/about" },
    { name: "Contact Us", href: "/contactus" },
  ];

  const studentLinks: NavLink[] = [
    { name: "Home", href: "/student-dashboard" },
    { name: "My Tasks", href: "/students/tasks" },
    { name: "Tickets", href: "/students/tickets" },
    { name: "Attendance", href: "/students/attendance" },
    { name: "Logout", onClick: handleLogout },
  ];

  // Show the Tickets entry in the trainer nav only if the trainer has been
  // granted ticket access (manage_queries or respond_queries) by an admin —
  // either whole-role via Spatie or per-user via UserPermissionOverride.
  const canAccessTickets = useHasPermission(['manage_queries', 'respond_queries']);

  const trainerLinks: NavLink[] = [
    { name: "Home", href: "/trainer" },
    { name: "Batches", href: "/trainer/batches" },
    { name: "Tasks", href: "/trainer/tasks" },
    { name: "Syllabus", href: "/trainer/syllabus" },
    { name: "Attendance", href: "/trainer/attendance" },
    ...(canAccessTickets ? [{ name: "Tickets", href: "/trainer/tickets" }] : []),
    { name: "Logout", onClick: handleLogout },
  ];

  const hrLinks: NavLink[] = [
    { name: "Home", href: "/hr" },
    { name: "Students", href: "/hr/students" },
    { name: "Batch", href: "/admin/batches" },
    { name: "Tasks", href: "/hr/tasks" },
    { name: "Enrolled Students", href: "/hr/enrolledStudents" },
    { name: "Payments", href: "/hr/fee" },
    { name: "Logout", onClick: handleLogout },
  ];

  // Admin nav slimmed to the new section-hub flow. The admin lands on
  // /admin (2-card hub), then drills into either /admin/easy-assess or
  // /admin/easy-coders for the full list of tools. Direct deep-links
  // (e.g. /admin/batches, /admin/permissions) still work for bookmarks
  // — they're listed inside the section dashboards.
  const adminLinks: NavLink[] = [
    { name: "Home", href: "/admin" },
    { name: "Easy Assess", href: "/admin/easy-assess" },
    { name: "Easy Coders", href: "/admin/easy-coders" },
    { name: "Logout", onClick: handleLogout },
  ];

  const guestLinks: NavLink[] = [
    ...commonLinks,
    { name: "Login", onClick: () => setShowLogin(true) },
  ];

  const roleNum = role ? parseInt(role, 10) : null;

  const logoRedirect =
    roleNum === 1
      ? "/admin"
      : roleNum === 2
        ? "/hr"
        : roleNum === 3
          ? "/student-dashboard"
          : roleNum === 4
            ? "/trainer"
            : "/";

  const navLinks: NavLink[] =
    roleNum === 1
      ? adminLinks
      : roleNum === 2
        ? hrLinks
        : roleNum === 4
          ? trainerLinks
          : roleNum === 3
            ? studentLinks
            : guestLinks;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .nb-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 999;
          display: flex;
          flex-direction: column;
        }

        .nb-header.scrolled { /* shadow now on .nb.scrolled */ }

        /* ── TOP CONTACT BAR ── */
        .top-bar {
          background: #F7F8FB;
          border-bottom: 1px solid rgba(11,27,58,0.09);
          padding: 7px 0;
          transition: max-height 0.38s ease, padding 0.38s ease, opacity 0.3s ease;
          overflow: hidden;
          max-height: 38px;
          opacity: 1;
        }

        .top-bar.hidden {
          max-height: 0;
          padding: 0;
          opacity: 0;
        }

        .top-bar-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 36px;
        }

        .top-bar-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 400;
          color: #4A5568;
          text-decoration: none;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }

        .top-bar-item:hover { color: #E8A020; }
        .top-bar-item svg { flex-shrink: 0; }

        .top-bar-sep {
          width: 1px;
          height: 13px;
          background: rgba(11,27,58,0.14);
        }

        /* ── MAIN NAVBAR ── */
        .nb {
          width: 100%;
          background: #ffffff;
          transition: background 0.35s ease, backdrop-filter 0.35s ease, box-shadow 0.35s ease;
          padding: 0;
        }

        .nb.scrolled {
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 24px rgba(11,27,58,0.13);
        }

        .nb-inner {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          height: 70px;
          transition: height 0.3s ease;
        }

        .nb.scrolled .nb-inner {
          height: 62px;
        }

        /* ── LOGO ── */
        .nb-logo img {
          height: 52px;
          width: auto;
          display: block;
          transition: height 0.3s ease;
        }

        .nb.scrolled .nb-logo img {
          height: 44px;
        }

        /* ── DESKTOP LINKS ── */
        .nb-links {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .nb-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #1E2D4E;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
          white-space: nowrap;
        }

        .nb.scrolled .nb-link { color: #1E2D4E; }
        .nb-link:hover { color: #E8A020; }
        .nb.scrolled .nb-link:hover { color: #E8A020; }
        .nb-link.nb-active { color: #E8A020 !important; }

        .nb-link::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 14px;
          right: 14px;
          height: 2px;
          background: #E8A020;
          border-radius: 2px;
          transform: scaleX(0);
          transition: transform 0.25s ease;
          transform-origin: left;
        }

        .nb-link:hover::after,
        .nb-link.nb-active::after {
          transform: scaleX(1);
        }

        .nb-link.nb-login {
          margin-left: 8px;
          padding: 9px 20px;
          border: 1.5px solid #0B1B3A;
          border-radius: 100px;
          color: #0B1B3A !important;
          letter-spacing: 0.06em;
          transition: all 0.2s;
        }

        .nb-link.nb-login::after { display: none; }

        .nb-link.nb-login:hover {
          background: #0B1B3A;
          color: #fff !important;
          border-color: #0B1B3A;
        }

        .nb.scrolled .nb-link.nb-login {
          border-color: #0B1B3A;
          color: #0B1B3A !important;
        }

        .nb.scrolled .nb-link.nb-login:hover {
          background: #0B1B3A;
          color: #fff !important;
        }

        /* Logout button */
        .nb-link.nb-logout {
          margin-left: 8px;
          padding: 9px 20px;
          border: 1.5px solid rgba(220,53,53,0.4);
          border-radius: 100px;
          color: #E05252 !important;
          background: rgba(220,53,53,0.06);
          transition: all 0.2s;
        }

        .nb-link.nb-logout::after { display: none; }

        .nb-link.nb-logout:hover {
          background: rgba(220,53,53,0.12);
          border-color: rgba(220,53,53,0.7);
        }

        /* Search */
        .nb-search {
          margin-left: 12px;
          flex-shrink: 0;
        }

        /* ── HAMBURGER ── */
        .nb-burger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          background: none;
          border: 1.5px solid rgba(11,27,58,0.2);
          border-radius: 10px;
          cursor: pointer;
          gap: 5px;
          transition: all 0.2s;
          padding: 0;
        }

        .nb.scrolled .nb-burger { border-color: rgba(11,27,58,0.2); }

        .nb-burger span {
          display: block;
          width: 18px;
          height: 2px;
          background: #0B1B3A;
          border-radius: 2px;
          transition: all 0.25s ease;
        }

        .nb.scrolled .nb-burger span { background: #0B1B3A; }

        .nb-burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
        .nb-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
        .nb-burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

        /* ── OVERLAY ── */
        .nb-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
          z-index: 997;
        }

        .nb-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* ── MOBILE DRAWER ── */
        .nb-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(82vw, 340px);
          height: 100vh;
          background: #fff;
          border-left: 1px solid #E2E8F0;
          z-index: 998;
          display: flex;
          flex-direction: column;
          padding: 0;
          transform: translateX(110%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow-y: auto;
        }

        .nb-drawer.open { transform: translateX(0); }

        .nb-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #F1F5F9;
        }

        .nb-drawer-head img {
          height: 40px;
          width: auto;
        }

        .nb-drawer-close {
          width: 36px; height: 36px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          color: #4A5568;
          transition: all 0.2s;
        }

        .nb-drawer-close:hover { background: #0B1B3A; color: #fff; border-color: #0B1B3A; }

        .nb-drawer-contact {
          padding: 14px 20px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nb-drawer-contact a {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748B;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
        }

        .nb-drawer-contact a:hover { color: #E8A020; }

        .nb-drawer-links {
          padding: 24px 20px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nb-mob-link {
          display: flex;
          align-items: center;
          padding: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #1E293B;
          text-decoration: none;
          border-radius: 12px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.18s;
          letter-spacing: 0.01em;
        }

        .nb-mob-link:hover {
          background: #F8FAFC;
          color: #0B1B3A;
          padding-left: 20px;
        }

        .nb-mob-link.mob-active {
          background: #FCF4E2;
          color: #0B1B3A;
          font-weight: 600;
        }

        .nb-mob-link.mob-logout {
          color: #DC3535;
          background: rgba(220,53,53,0.04);
          border: 1px solid rgba(220,53,53,0.15);
          margin-top: 8px;
        }

        .nb-mob-link.mob-logout:hover {
          background: rgba(220,53,53,0.08);
          padding-left: 20px;
        }

        .nb-mob-link.mob-login {
          background: #0B1B3A;
          color: #E8A020;
          font-weight: 600;
          margin-top: 8px;
          justify-content: center;
          letter-spacing: 0.04em;
        }

        .nb-mob-link.mob-login:hover {
          background: #152D5A;
          color: #F5C356;
          padding-left: 16px;
        }

        @media (max-width: 900px) {
          .nb-links { display: none; }
          .nb-search { display: none; }
          .nb-burger { display: flex; }
          .nb-overlay { display: block; }
        }

        @media (max-width: 480px) {
          .nb-inner { padding: 0 16px; }
          .top-bar-inner { padding: 0 16px; gap: 20px; }
        }

        @media (max-width: 900px) {
          .nb-drawer-contact {
            display: none;
          }
        }
      `}</style>

      {/* ── FIXED HEADER WRAPPER ── */}
      <div className={`nb-header${isScrolled ? " scrolled" : ""}`}>
        {/* ── TOP CONTACT BAR ── */}
        <div className={`top-bar${isScrolled ? " hidden" : ""}`}>
  <div className="top-bar-inner">

    <a
  href="tel:+917523930301"
  className="top-bar-item"
>
  <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
    <path d="M160.2 25C152.3 6.1 131.7-3.9 112.1 1.4l-5.5 1.5c-64.6 17.6-119.8 80.2-103.7 156.4 37.1 175 174.8 312.7 349.8 349.8 76.3 16.2 138.8-39.1 156.4-103.7l1.5-5.5c5.4-19.7-4.7-40.3-23.5-48.1l-97.3-40.5c-16.5-6.9-35.6-2.1-47 11.8l-38.6 47.2C233.9 335.4 177.3 277 144.8 205.3L189 169.3c13.9-11.3 18.6-30.4 11.8-47L160.2 25z"/>
  </svg>
  7523930301
</a>

    <div className="top-bar-sep" />

    {/* WhatsApp */}
    <a
      href="https://wa.me/917523930301"
      target="_blank"
      rel="noopener noreferrer"
      className="top-bar-item"
    >
      <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.2-157zM223.9 438.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.5-186.6 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
      Chat on WhatsApp
    </a>

    <div className="top-bar-sep" />

    {/* Gmail */}
    <a
      href="https://mail.google.com/mail/?view=cm&fs=1&to=team@easycoders.in"
      target="_blank"
      rel="noopener noreferrer"
      className="top-bar-item"
    >
      <svg width="14" height="14" viewBox="0 0 512 512" fill="currentColor">
        <path d="M256 64C150 64 64 150 64 256s86 192 192 192c17.7 0 32 14.3 32 32s-14.3 32-32 32C114.6 512 0 397.4 0 256S114.6 0 256 0 512 114.6 512 256l0 32c0 53-43 96-96 96-29.3 0-55.6-13.2-73.2-33.9-22.8 21-53.3 33.9-86.8 33.9-70.7 0-128-57.3-128-128s57.3-128 128-128c27.9 0 53.7 8.9 74.7 24.1 5.7-5 13.1-8.1 21.3-8.1 17.7 0 32 14.3 32 32l0 112c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32c0-106-86-192-192-192zm64 192a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z"/>
      </svg>
      team@easycoders.in
    </a>

  </div>
</div>

        {/* ── MAIN NAVBAR ── */}
        <nav className={`nb${isScrolled ? " scrolled" : ""}`}>
          <div className="nb-inner">
            {/* Logo */}
            <div className="nb-logo">
              <Link href={logoRedirect}>
                <img src="/images/logo.svg" alt="Easy Coders Logo" />
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="nb-links">
              {/* In-app notifications bell — only renders when logged in */}
              <NotificationsBell />
              {navLinks.map((link) => {
                const isLogout = link.name === "Logout";
                const isLogin = link.name === "Login";
                const isActive = link.href && pathname === link.href;

                return (
                  <Link
                    key={link.name}
                    href={link.href || "#"}
                    onClick={(e) => {
                      if (link.onClick) {
                        e.preventDefault();
                        link.onClick();
                      }
                    }}
                    className={[
                      "nb-link",
                      isLogout ? "nb-logout" : "",
                      isLogin ? "nb-login" : "",
                      isActive ? "nb-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {link.name}
                  </Link>
                );
              })}

            </div>

            {/* Hamburger */}
            <button
              className={`nb-burger${isOpen ? " open" : ""}`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </nav>
      </div>
      {/* end .nb-header */}

      {/* ── OVERLAY ── */}
      <div
        className={`nb-overlay${isOpen ? " visible" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      {/* ── MOBILE DRAWER ── */}
      <div className={`nb-drawer${isOpen ? " open" : ""}`}>
        <div className="nb-drawer-head">
          <img src="/images/logo.svg" alt="Easy Coders" />
          <button className="nb-drawer-close" onClick={() => setIsOpen(false)}>
            ✕
          </button>
        </div>

        {!role && (
          <div className="nb-drawer-contact">
            <a href="tel:7523930301">
              <svg
                width="13"
                height="13"
                viewBox="0 0 512 512"
                fill="currentColor"
              >
                <path d="M160.2 25C152.3 6.1 131.7-3.9 112.1 1.4l-5.5 1.5c-64.6 17.6-119.8 80.2-103.7 156.4 37.1 175 174.8 312.7 349.8 349.8 76.3 16.2 138.8-39.1 156.4-103.7l1.5-5.5c5.4-19.7-4.7-40.3-23.5-48.1l-97.3-40.5c-16.5-6.9-35.6-2.1-47 11.8l-38.6 47.2C233.9 335.4 177.3 277 144.8 205.3L189 169.3c13.9-11.3 18.6-30.4 11.8-47L160.2 25z" />
              </svg>
              7523930301
            </a>
            <a href="mailto:hr@technobren.com">
              <svg
                width="13"
                height="13"
                viewBox="0 0 512 512"
                fill="currentColor"
              >
                <path d="M256 64C150 64 64 150 64 256s86 192 192 192c17.7 0 32 14.3 32 32s-14.3 32-32 32C114.6 512 0 397.4 0 256S114.6 0 256 0 512 114.6 512 256l0 32c0 53-43 96-96 96-29.3 0-55.6-13.2-73.2-33.9-22.8 21-53.3 33.9-86.8 33.9-70.7 0-128-57.3-128-128s57.3-128 128-128c27.9 0 53.7 8.9 74.7 24.1 5.7-5 13.1-8.1 21.3-8.1 17.7 0 32 14.3 32 32l0 112c0 17.7 14.3 32 32 32s32-14.3 32-32l0-32c0-106-86-192-192-192zm64 192a64 64 0 1 0 -128 0 64 64 0 1 0 128 0z" />
              </svg>
              hr@technobren.com
            </a>
          </div>
        )}

        <div className="nb-drawer-links">
          {navLinks.map((link) => {
            const isLogout = link.name === "Logout";
            const isLogin = link.name === "Login";
            const isActive = link.href && pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href || "#"}
                onClick={(e) => {
                  if (link.onClick) {
                    e.preventDefault();
                    link.onClick();
                  }
                  setIsOpen(false);
                }}
                className={[
                  "nb-mob-link",
                  isLogout ? "mob-logout" : "",
                  isLogin ? "mob-login" : "",
                  isActive ? "mob-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}