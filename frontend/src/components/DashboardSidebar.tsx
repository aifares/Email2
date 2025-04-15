"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("light");
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    // Check for theme in localStorage on load
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    setCurrentTheme(savedTheme);

    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById("theme-dropdown-container");
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add toggleTheme function for the dropdown
  const toggleTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    setCurrentTheme(theme);
    setThemeDropdownOpen(false); // Close dropdown after selection
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div
      className={`bg-base-100 h-screen border-r border-base-200 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      } transition-all duration-300`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center">
        <span className="icon-[tabler--mail] text-primary size-6"></span>
        {!collapsed && (
          <span className="ml-2 text-lg font-medium text-primary">EmailAI</span>
        )}
      </div>

      {/* User Profile Preview */}
      <div
        className={`py-3 px-4 border-b border-base-200 flex items-center ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="avatar">
          <div className="w-8 rounded-full">
            <img src="https://i.pravatar.cc/100?img=32" alt="User avatar" />
          </div>
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-base-content/70 truncate">
              Free Account
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2">
        <ul className="menu menu-sm px-2 gap-1">
          <li>
            <Link
              href="/dashboard"
              className={
                isActive("/dashboard") ? "active bg-base-200 font-medium" : ""
              }
            >
              <span className="icon-[tabler--dashboard] size-4"></span>
              {!collapsed && <span className="text-sm">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/account"
              className={
                isActive("/dashboard/account")
                  ? "active bg-base-200 font-medium"
                  : ""
              }
            >
              <span className="icon-[tabler--user] size-4"></span>
              {!collapsed && <span className="text-sm">Account Info</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/analytics"
              className={
                isActive("/dashboard/analytics")
                  ? "active bg-base-200 font-medium"
                  : ""
              }
            >
              <span className="icon-[tabler--chart-line] size-4"></span>
              {!collapsed && <span className="text-sm">Analytics</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/agents"
              className={
                isActive("/dashboard/agents")
                  ? "active bg-base-200 font-medium"
                  : ""
              }
            >
              <span className="icon-[tabler--robot] size-4"></span>
              {!collapsed && <span className="text-sm">Agents</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/calendar"
              className={
                isActive("/dashboard/calendar")
                  ? "active bg-base-200 font-medium"
                  : ""
              }
            >
              <span className="icon-[tabler--calendar] size-4"></span>
              {!collapsed && <span className="text-sm">Calendar</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Theme Selector at Bottom - New Implementation */}
      <div className="p-3 border-t border-base-200 flex justify-center">
        <div id="theme-dropdown-container" className="relative">
          <button
            id="theme-dropdown"
            type="button"
            className="flex items-center text-base-content hover:text-primary"
            aria-haspopup="menu"
            aria-expanded={themeDropdownOpen}
            aria-label="Theme"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
          >
            <span className="icon-[tabler--palette] block size-6 mr-2"></span>
            {!collapsed && <span>Theme</span>}
          </button>
          <ul
            className={`absolute bottom-full left-0 mb-2 bg-base-200 z-40 max-h-60 min-w-48 space-y-1.5 overflow-y-auto rounded-md p-1 shadow-lg ${
              themeDropdownOpen ? "block" : "hidden"
            }`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="theme-dropdown"
          >
            <li>
              <button
                type="button"
                data-theme="light"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "light" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("light")}
              >
                <div className="flex justify-between gap-3">
                  light
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="dark"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "dark" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("dark")}
              >
                <div className="flex justify-between gap-3">
                  dark
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="black"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "black" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("black")}
              >
                <div className="flex justify-between gap-3">
                  black
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="corporate"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "corporate" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("corporate")}
              >
                <div className="flex justify-between gap-3">
                  corporate
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="ghibli"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "ghibli" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("ghibli")}
              >
                <div className="flex justify-between gap-3">
                  ghibli
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="gourmet"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "gourmet" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("gourmet")}
              >
                <div className="flex justify-between gap-3">
                  gourmet
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="luxury"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "luxury" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("luxury")}
              >
                <div className="flex justify-between gap-3">
                  luxury
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="mintlify"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "mintlify" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("mintlify")}
              >
                <div className="flex justify-between gap-3">
                  mintlify
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="shadcn"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "shadcn" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("shadcn")}
              >
                <div className="flex justify-between gap-3">
                  shadcn
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="slack"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "slack" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("slack")}
              >
                <div className="flex justify-between gap-3">
                  slack
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="soft"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "soft" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("soft")}
              >
                <div className="flex justify-between gap-3">
                  soft
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
            <li>
              <button
                type="button"
                data-theme="valorant"
                className={`bg-base-100 rounded-md w-full cursor-pointer px-2 py-1.5 text-start capitalize ${
                  currentTheme === "valorant" ? "border-2 border-primary" : ""
                }`}
                onClick={() => toggleTheme("valorant")}
              >
                <div className="flex justify-between gap-3">
                  valorant
                  <div className="flex items-center gap-1">
                    <span className="bg-primary h-4.5 w-1.5"></span>
                    <span className="bg-secondary h-4.5 w-1.5"></span>
                    <span className="bg-accent h-4.5 w-1.5"></span>
                    <span className="bg-neutral h-4.5 w-1.5"></span>
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <div className="p-3 border-t border-base-200 flex justify-center">
        <button
          onClick={toggleSidebar}
          className="btn btn-sm btn-ghost btn-square"
          aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span
            className={`icon-[tabler--chevron-${
              collapsed ? "right" : "left"
            }] size-4`}
          ></span>
        </button>
      </div>
    </div>
  );
}
