import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

/**
 * Drop-in replacement for the old placeholder SocialLoginButton. Renders
 * Google's own "Continue with Google" button (via Google Identity
 * Services) and, on success, sends the returned ID token to the backend.
 *
 * If VITE_GOOGLE_CLIENT_ID isn't configured, GoogleOAuthProvider (see
 * main.jsx) still renders without crashing, but this button will fail on
 * click - shown to the user as a toast rather than a silent no-op.
 */
export default function GoogleLoginButton({ onSuccess }) {
  const { t } = useTranslation();
  const { signInWithGoogle, isLoading } = useGoogleAuth();

  const handleSuccess = async (credentialResponse) => {
    try {
      const data = await signInWithGoogle(credentialResponse.credential);
      onSuccess?.(data);
    } catch (err) {
      toast.error(err.message || t("auth.googleLoginFailed", "Google sign-in failed."));
    }
  };

  return (
    <div className={isLoading ? "pointer-events-none opacity-60" : ""}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => toast.error(t("auth.googleLoginFailed", "Google sign-in failed."))}
        theme="outline"
        shape="pill"
        width="100%"
        text="continue_with"
      />
    </div>
  );
}
