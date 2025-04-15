"use client";

import HomeNavBar from "@/components/HomeNavBar";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);

      // Firebase authentication
      const userCredential = await login(email, password);

      // Save user data in MongoDB
      const response = await fetch(
        "http://localhost:3001/firebase-auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firebaseUid: userCredential.user.uid,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to sign in");
      }
    } catch (err) {
      setError("Failed to sign in");
      console.error(err);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      // Google authentication with Firebase
      const userCredential = await loginWithGoogle();

      // Save user data in MongoDB
      const response = await fetch(
        "http://localhost:3001/firebase-auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userCredential.user.email,
            firebaseUid: userCredential.user.uid,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to sign in with Google");
      }
    } catch (err) {
      setError("Failed to sign in with Google");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <HomeNavBar />

      <div className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold text-center mx-auto mb-6">
              Welcome Back
            </h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label className="label">
                  <a
                    href="/forgot-password"
                    className="label-text-alt link link-hover"
                  >
                    Forgot password?
                  </a>
                </label>
              </div>

              <div className="form-control">
                <label className="flex gap-2 cursor-pointer">
                  <input type="checkbox" className="checkbox" />
                  <span className="label-text">Remember me</span>
                </label>
              </div>

              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>

            <div className="divider">OR</div>

            <div className="space-y-3">
              <button
                className="btn btn-outline w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <span className="icon-[tabler--brand-google] size-5 mr-2"></span>
                Continue with Google
              </button>
              <button className="btn btn-outline w-full">
                <span className="icon-[tabler--brand-microsoft] size-5 mr-2"></span>
                Continue with Microsoft
              </button>
            </div>

            <p className="text-center mt-6">
              Don't have an account?{" "}
              <Link href="/signup" className="link link-primary link-hover">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
