import HomeNavBar from "@/components/HomeNavBar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavBar />

      {/* Hero section with padding-top to account for fixed navbar */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto">
          Manage Your Emails with{" "}
          <span className="text-primary">AI-Powered</span> Agents
        </h1>
        <p className="text-xl text-base-content/80 max-w-2xl mb-8">
          Create intelligent agents that respond to your emails, organize your
          inbox, and save you hours every week.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/signup" className="btn btn-primary btn-lg">
            Get Started
          </a>
          <a href="/demo" className="btn btn-outline btn-lg">
            See Demo
          </a>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            How EmailAI Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="mb-4 text-primary">
                  <span className="icon-[tabler--robot] size-12"></span>
                </div>
                <h3 className="card-title text-xl mb-2">
                  Create Custom Agents
                </h3>
                <p>
                  Build personalized AI agents tailored to respond to specific
                  types of emails just like you would.
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="mb-4 text-primary">
                  <span className="icon-[tabler--mailbox] size-12"></span>
                </div>
                <h3 className="card-title text-xl mb-2">Manage Your Inbox</h3>
                <p>
                  Automatically categorize, prioritize, and organize your emails
                  to keep your inbox clean and efficient.
                </p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="mb-4 text-primary">
                  <span className="icon-[tabler--clock] size-12"></span>
                </div>
                <h3 className="card-title text-xl mb-2">Save Time</h3>
                <p>
                  Reclaim hours every week by letting AI handle routine
                  correspondence and email management tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">What Our Users Say</h2>

          <div className="card bg-base-100 shadow-xl max-w-3xl mx-auto">
            <div className="card-body">
              <p className="text-xl italic mb-6">
                "EmailAI has completely transformed how I handle my inbox. I've
                saved at least 10 hours every week by letting my custom agents
                handle routine emails."
              </p>
              <div className="flex items-center justify-center">
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    <img
                      src="https://i.pravatar.cc/100?img=32"
                      alt="User avatar"
                    />
                  </div>
                </div>
                <div className="ml-4 text-left">
                  <p className="font-bold">Sarah Johnson</p>
                  <p className="text-sm text-base-content/70">
                    Marketing Director
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-primary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Email Experience?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are saving time and reducing
            stress with EmailAI.
          </p>
          <a
            href="/signup"
            className="btn btn-lg bg-white text-primary hover:bg-white/90"
          >
            Sign Up Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer p-10 bg-neutral text-neutral-content">
        <div>
          <span className="footer-title">EmailAI</span>
          <a className="link link-hover">About us</a>
          <a className="link link-hover">Contact</a>
          <a className="link link-hover">Blog</a>
        </div>
        <div>
          <span className="footer-title">Product</span>
          <a className="link link-hover">Features</a>
          <a className="link link-hover">Pricing</a>
          <a className="link link-hover">API</a>
        </div>
        <div>
          <span className="footer-title">Legal</span>
          <a className="link link-hover">Terms of use</a>
          <a className="link link-hover">Privacy policy</a>
          <a className="link link-hover">Cookie policy</a>
        </div>
        <div>
          <span className="footer-title">Newsletter</span>
          <div className="form-control w-full max-w-xs">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="input input-bordered w-full max-w-xs"
              />
              <button className="btn btn-primary">Subscribe</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
