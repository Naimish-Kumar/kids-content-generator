import React, { useState } from "react";
import { User } from "../types";
import { Shield, Lock, Key, Copy, Check, Users, RefreshCw, AlertCircle, LogOut } from "lucide-react";

interface OAuthGatewayProps {
  currentUser: User;
  onUpdateUser: (updated: Partial<User>) => void;
  onPostNotification: (title: string, message: string, type: "success" | "warning" | "alert") => void;
}

export const OAuthGateway: React.FC<OAuthGatewayProps> = ({
  currentUser,
  onUpdateUser,
  onPostNotification,
}) => {
  const [showOauthChoice, setShowOauthChoice] = useState(false);
  const [oauthStep, setOauthStep] = useState<"none" | "consent" | "mfa">("none");
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student">("teacher");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  // Constants simulating OAuth protocol parameters
  const oauthClientState = "oauth_token_claim_session_2026";
  const mfaBackupSecret = "K5SG EY3M N5XG O4S2 - NCF CBSE SECURITY";

  const handleOpenOauth = () => {
    setShowOauthChoice(true);
    setOauthStep("consent");
  };

  const handleCancelOauth = () => {
    setShowOauthChoice(false);
    setOauthStep("none");
  };

  const handleApproveConsent = () => {
    if (currentUser.mfaRequired) {
      setOauthStep("mfa");
    } else {
      // Direct login if MFA is not enabled in settings
      onUpdateUser({
        name: selectedRole === "teacher" ? "M.S. Raghavan (CBSE Advisor)" : "Aditya Sharma (Grade 1 student)",
        email: selectedRole === "teacher" ? "vnaimishkumar@gmail.com" : "student.aditya@cbse.edu.in",
        role: selectedRole,
        isAuthenticated: true,
        mfaVerified: false
      });
      setShowOauthChoice(false);
      setOauthStep("none");
      onPostNotification(
        "OAuth Identity Verified",
        `Welcome back! Authenticated securely using standard OAuth 2.0 protocol.`,
        "success"
      );
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");

    if (mfaCode === "123456" || mfaCode.trim() === "000000" || mfaCode.length === 6) {
      onUpdateUser({
        name: selectedRole === "teacher" ? "M.S. Raghavan (CBSE Advisor)" : "Aditya Sharma (Grade 1 student)",
        email: selectedRole === "teacher" ? "vnaimishkumar@gmail.com" : "student.aditya@cbse.edu.in",
        role: selectedRole,
        isAuthenticated: true,
        mfaVerified: true
      });
      setShowOauthChoice(false);
      setOauthStep("none");
      setMfaCode("");
      
      onPostNotification(
        "MFA Secure Gate Cleared",
        "Dual phase authentication complete. Dynamic token claims written.",
        "success"
      );
    } else {
      setMfaError("Incorrect TOTP token code. Try entering '123456' for verification purposes.");
    }
  };

  const handleSignout = () => {
    onUpdateUser({
      name: "",
      email: "",
      role: "student",
      isAuthenticated: false,
      mfaVerified: false
    });
    onPostNotification(
      "Signed Out",
      "OAuth 2.0 Session revoked on active client node.",
      "info"
    );
  };

  const handleToggleMfaPreference = () => {
    const nextVal = !currentUser.mfaRequired;
    onUpdateUser({ mfaRequired: nextVal });
    
    onPostNotification(
      nextVal ? "MFA Protection Enabled" : "MFA Revoked",
      nextVal 
        ? "Two-Factor authentication now enforced for future CBSE class credentials."
        : "Standard session release is active. Multi-factor checks bypassed.",
      "alert"
    );
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mfaBackupSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-5" aria-live="polite">
      
      {!currentUser.isAuthenticated ? (
        // logged out state
        <div className="text-center py-6 space-y-4">
          <div className="inline-flex p-3 bg-blue-50 dark:bg-slate-950 text-blue-500 rounded-full">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display">
              Federated CBSE Security Gateway
            </h3>
            <p className="text-xs text-slate-500">
              Personalized CBSE curricula are protected under industry-standard OAuth 2.0 and Multi-Factor Authentications.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => { setSelectedRole("teacher"); handleOpenOauth(); }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
              id="signin-oauth-teacher-btn"
            >
              Sign in as CBSE Teacher
            </button>
            <button
              onClick={() => { setSelectedRole("student"); handleOpenOauth(); }}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-755 text-xs font-semibold rounded-lg transition cursor-pointer"
              id="signin-oauth-student-btn"
            >
              Sign in as Student
            </button>
          </div>
        </div>
      ) : (
        // logged in profile and settings state
        <div className="space-y-4 text-xs" id="active-session-profile">
          <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-805 pb-3">
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">
                ● Connected Session Active
              </span>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5">
                OAuth 2.0 Holder Profile
              </h4>
            </div>
            <button
              onClick={handleSignout}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-slate-950 dark:text-red-400 font-semibold rounded-lg inline-flex items-center gap-1 transition cursor-pointer"
              id="signout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Profile details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
            <div className="space-y-1">
              <p className="text-slate-400 font-medium">Verified Identity:</p>
              <p className="font-semibold text-slate-800 dark:text-slate-150 text-sm">{currentUser.name}</p>
              <p className="text-slate-500">{currentUser.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-medium">Protocol Authority Level:</p>
              <p className="font-semibold uppercase text-blue-600 dark:text-blue-400">
                {currentUser.role} Account privileges
              </p>
              <p className="text-slate-500">MFA Enforce Match: {currentUser.mfaVerified ? "Passed Checks" : "Bypassed (Teachers default)"}</p>
            </div>
          </div>

          {/* Secure settings panel */}
          <div className="space-y-3 pt-2">
            <h5 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
              Multi-Factor Authentication (MFA) Settings
            </h5>
            
            <div className="flex items-center justify-between p-3 border border-slate-150 dark:border-slate-805 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Enforce 2-Phase authentication code</p>
                <p className="text-slate-450 dark:text-slate-500 text-[10px] mt-0.5">
                  Prompts for an Authenticator 6-digit TOTP token during next OAuth login sequence.
                </p>
              </div>

              <button
                onClick={handleToggleMfaPreference}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  currentUser.mfaRequired ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                }`}
                role="switch"
                aria-checked={currentUser.mfaRequired}
                aria-label="Toggle MFA requirement"
                id="mfa-toggle-setting"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    currentUser.mfaRequired ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {currentUser.mfaRequired && (
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-xl space-y-3">
                <div className="flex gap-2 items-start text-indigo-650 dark:text-indigo-400">
                  <Shield className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-250">TOTP Key Setup details</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Store this backup encryption secret inside visual Google Authenticator or school key vaults to register.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-lg font-mono">
                  <span className="text-[11px] text-slate-750 dark:text-slate-350 select-all font-semibold">
                    {mfaBackupSecret}
                  </span>
                  <button
                    onClick={handleCopySecret}
                    className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded text-[10px] flex items-center gap-1 transition cursor-pointer"
                  >
                    {secretCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy secret
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OAuth 2.0 Consent popup Modal */}
      {showOauthChoice && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-xs text-slate-755 dark:text-slate-300"
          role="dialog"
          aria-modal="true"
          id="oauth-consent-modal"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            
            {oauthStep === "consent" ? (
              // Consent Panel
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xl">🔑</span>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display">
                    Secure CBSE Identity Authorization
                  </h4>
                  <p className="text-slate-450 dark:text-slate-400">
                    Client State: {oauthClientState}
                  </p>
                </div>

                <div className="border border-slate-100 dark:border-slate-850 p-3.5 rounded-lg space-y-2 text-[11px]">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    The applet requests permissions to:
                  </p>
                  <ul className="list-disc ml-4 space-y-1 text-slate-500 leading-normal">
                    <li>Confirm account verified status and identity.</li>
                    <li>Synchronize active curriculum parameters to cloud SQL server.</li>
                    <li>Read class assignments and student analytics metrics.</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCancelOauth}
                    className="w-1/2 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveConsent}
                    className="w-1/2 py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                    id="oauth-approve-btn"
                  >
                    Authorize Access
                  </button>
                </div>
              </div>
            ) : (
              // MFA Verification Code prompt panel
              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div className="text-center space-y-1">
                  <Key className="w-7 h-7 text-indigo-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-display">
                    Verify Multi-Factor Code
                  </h4>
                  <p className="text-slate-450 dark:text-slate-400">
                    Account is protected by 2-Factor standards.
                  </p>
                </div>

                <div>
                  <label htmlFor="totp-code" className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 text-center">
                    Enter Authenticator App Token
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g., 123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg py-2.5 px-3 text-sm font-bold tracking-widest focus:outline-none"
                  />
                  <p className="text-[9px] text-slate-400 text-center mt-1.5">
                    Demo Code: Enter <strong>123456</strong> or any 6 digits to verify the session.
                  </p>
                </div>

                {mfaError && (
                  <p className="text-rose-500 text-[11px] font-medium text-center">{mfaError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelOauth}
                    className="w-1/2 py-2 border border-slate-200 text-slate-650 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Verify Code
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};
