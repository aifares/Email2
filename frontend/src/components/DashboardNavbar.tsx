"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function DashboardNavbar({ title = "" }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="navbar h-12 min-h-0 bg-base-100 border-b border-base-200 px-4">
      <div className="flex-1">
        {title && <div className="text-base font-medium ml-2">{title}</div>}
      </div>

      <div className="flex-none gap-1">
        {/* Search */}
        <div className="form-control">
          <input
            type="text"
            placeholder="Search..."
            className="input input-sm input-bordered w-64 max-md:w-32"
          />
        </div>

        {/* Notifications */}
        <div className="dropdown dropdown-end">
          <button className="btn btn-sm btn-ghost btn-circle">
            <div className="indicator">
              <span className="icon-[tabler--bell] size-4"></span>
              <span className="badge badge-xs badge-primary indicator-item">
                3
              </span>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-sm shadow mt-1 w-80 p-2 bg-base-100 rounded-box dropdown-open:opacity-100 hidden">
            <li className="menu-title text-xs">Notifications</li>
            <li className="py-2 border-b border-base-200 text-xs">
              <a className="flex gap-3 items-start">
                <span className="icon-[tabler--mail] size-4 mt-1 text-primary"></span>
                <div>
                  <p className="font-medium">New Email</p>
                  <p className="text-xs">You have a new email from John Doe</p>
                  <p className="text-xs text-base-content/60">5 minutes ago</p>
                </div>
              </a>
            </li>
            <li className="py-2 border-b border-base-200 text-xs">
              <a className="flex gap-3 items-start">
                <span className="icon-[tabler--robot] size-4 mt-1 text-primary"></span>
                <div>
                  <p className="font-medium">Agent Activity</p>
                  <p className="text-xs">Your agent handled 5 emails today</p>
                  <p className="text-xs text-base-content/60">2 hours ago</p>
                </div>
              </a>
            </li>
            <li className="py-2 text-xs">
              <a className="flex gap-3 items-start">
                <span className="icon-[tabler--alert-circle] size-4 mt-1 text-warning"></span>
                <div>
                  <p className="font-medium">Account Update</p>
                  <p className="text-xs">Please verify your email address</p>
                  <p className="text-xs text-base-content/60">1 day ago</p>
                </div>
              </a>
            </li>
            <li className="menu-title text-xs">
              <a
                href="/dashboard/notifications"
                className="link link-hover text-primary"
              >
                View All
              </a>
            </li>
          </ul>
        </div>

        {/* User dropdown */}
        <div className="dropdown dropdown-end">
          <button
            className="btn btn-sm btn-ghost btn-circle avatar"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-7 rounded-full">
              <img src="https://i.pravatar.cc/100?img=32" alt="User avatar" />
            </div>
          </button>
          <ul
            className={`dropdown-menu dropdown-menu-sm mt-1 p-2 shadow bg-base-100 rounded-box w-48 dropdown-open:opacity-100 ${
              showDropdown ? "block" : "hidden"
            }`}
          >
            <li className="menu-title text-xs font-medium">
              <span className="truncate">{user?.email}</span>
            </li>
            <li>
              <a className="text-xs py-2" href="/dashboard/profile">
                Profile
              </a>
            </li>
            <li>
              <a className="text-xs py-2" href="/dashboard/settings">
                Settings
              </a>
            </li>
            <li>
              <a className="text-xs py-2" onClick={handleLogout}>
                Logout
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
