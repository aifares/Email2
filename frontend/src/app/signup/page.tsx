"use client";

import HomeNavBar from "@/components/HomeNavBar";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // Firebase authentication - create new user
      const userCredential = await signup(email, password);

      // Save user data in MongoDB
      const response = await fetch(
        "http://localhost:3001/firebase-auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firebaseUid: userCredential.user.uid,
            firstName,
            lastName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to create account");
      }
    } catch (err: any) {
      // Extract Firebase error message
      if (err.code === "auth/email-already-in-use") {
        setError(
          "Email is already in use. Please use a different email or try logging in."
        );
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Failed to create account");
      }
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
        setError(data.message || "Failed to sign up with Google");
      }
    } catch (err) {
      setError("Failed to sign up with Google");
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
              Create Your Account
            </h2>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John"
                    className="input input-bordered w-full"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Doe"
                    className="input input-bordered w-full"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

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
                  minLength={8}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/70">
                    Must be at least 8 characters
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="flex gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox"
                    required
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                  />
                  <span className="label-text">
                    I agree to the
                    <Link
                      href="/terms"
                      className="link link-primary link-hover ml-1"
                    >
                      Terms of Service
                    </Link>{" "}
                    and
                    <Link
                      href="/privacy"
                      className="link link-primary link-hover ml-1"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
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
                Sign up with Google
              </button>
              <button className="btn btn-outline w-full">
                <span className="icon-[tabler--brand-microsoft] size-5 mr-2"></span>
                Sign up with Microsoft
              </button>
            </div>

            <p className="text-center mt-6">
              Already have an account?{" "}
              <Link href="/login" className="link link-primary link-hover">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
