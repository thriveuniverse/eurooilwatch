'use client';

import { useState } from 'react';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="text-gray-400 hover:text-white p-2 -mr-2"
        aria-label="Toggle menu"
      >
        {open ? (
          // X icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-oil-950 border-b border-oil-800 shadow-lg z-50">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <a
              href="/"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded text-sm text-gray-300 hover:text-white hover:bg-oil-800/60 transition"
            >
              Dashboard
            </a>
            <a
              href="/prices"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded text-sm text-gray-300 hover:text-white hover:bg-oil-800/60 transition"
            >
              Prices
            </a>
            <a
              href="/methodology"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded text-sm text-gray-300 hover:text-white hover:bg-oil-800/60 transition"
            >
              Methodology
            </a>
            <a
              href="/about"
              onClick={() => setOpen(false)}
              className="py-2.5 px-3 rounded text-sm text-gray-300 hover:text-white hover:bg-oil-800/60 transition"
            >
              About
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
