import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";

// Thin wrapper around AuthContext.googleLogin that tracks loading/error
// state for whatever button/UI triggers it.
export function useGoogleAuth() {
  const { googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async (credential) => {
    setError("");
    setIsLoading(true);
    try {
      return await googleLogin(credential);
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithGoogle, isLoading, error };
}
