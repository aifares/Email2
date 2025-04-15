import Link from "next/link";

export default function HomeNavBar() {
  return (
    <nav className="navbar shadow bg-base-100 fixed top-0 left-0 right-0 z-50">
      <div className="navbar-start">
        <Link
          className="link text-primary text-xl font-bold no-underline flex items-center gap-2"
          href="/"
        >
          <span className="icon-[tabler--mail] size-6"></span>
          <span>EmailAI</span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-6 p-0 text-base">
          <li>
            <Link href="/features" className="font-medium hover:text-primary">
              Features
            </Link>
          </li>
          <li>
            <Link href="/pricing" className="font-medium hover:text-primary">
              Pricing
            </Link>
          </li>
          <li>
            <Link href="/about" className="font-medium hover:text-primary">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="font-medium hover:text-primary">
              Contact
            </Link>
          </li>
        </ul>
      </div>

      <div className="navbar-end">
        {/* Theme Selection */}
        <div className="dropdown relative inline-flex mr-4 rtl:[--placement:bottom-end]">
          <button
            id="dropdown-default"
            type="button"
            className="dropdown-toggle btn btn-ghost btn-outline max-sm:btn-square"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Theme"
          >
            <span className="max-sm:hidden">Theme</span>
            <span className="icon-[tabler--palette] block size-5 sm:hidden"></span>
            <span className="icon-[tabler--chevron-down] dropdown-open:rotate-180 size-4 max-sm:hidden ml-1"></span>
          </button>
          <ul
            className="dropdown-menu dropdown-open:opacity-100 hidden min-w-40"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="dropdown-default"
          >
            <li>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-text w-full justify-start"
                aria-label="Light"
                value="light"
                defaultChecked
              />
            </li>
            <li>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-text w-full justify-start"
                aria-label="Dark"
                value="dark"
              />
            </li>
            <li>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-text w-full justify-start"
                aria-label="Gourmet"
                value="gourmet"
              />
            </li>
            <li>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-text w-full justify-start"
                aria-label="Corporate"
                value="corporate"
              />
            </li>
            <li>
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller btn btn-text w-full justify-start"
                aria-label="Luxury"
                value="luxury"
              />
            </li>
          </ul>
        </div>

        {/* Login/Signup */}
        <div className="hidden md:flex gap-4">
          <Link href="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="dropdown dropdown-end lg:hidden">
          <button className="btn btn-ghost btn-square" aria-label="Menu">
            <span className="icon-[tabler--menu-2] size-5"></span>
          </button>
          <ul className="dropdown-menu min-w-60 dropdown-open:opacity-100 hidden">
            <li>
              <Link href="/features" className="dropdown-item">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="dropdown-item">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/about" className="dropdown-item">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="dropdown-item">
                Contact
              </Link>
            </li>
            <li className="divider"></li>
            <li>
              <Link href="/login" className="dropdown-item">
                Login
              </Link>
            </li>
            <li>
              <Link href="/signup" className="dropdown-item">
                Sign Up
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
