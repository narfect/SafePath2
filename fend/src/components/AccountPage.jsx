import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getCurrentUser, updateUserPreferences } from "../utils/firebaseAuth";
import { API_BASE_URL } from "../config/api";
import { ROUTES } from "../utils/routes";

const DEFAULT_PREFERENCES = {
  gender: "",
  ageGroup: "",
  transportMode: "",
  transportTimes: {
    morning: false,
    afternoon: false,
    evening: false,
    night: false,
  },
};

const normalizePreferences = (preferences = {}) => ({
  gender: preferences.gender || "",
  ageGroup: preferences.ageGroup || preferences.age || "",
  transportMode: preferences.transportMode || preferences.transport || "",
  transportTimes: {
    ...DEFAULT_PREFERENCES.transportTimes,
    ...(preferences.transportTimes || {}),
  },
});

const AccountPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAccount = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }

        if (!isMounted) {
          return;
        }

        setProfile(currentUser);
        setPreferences(normalizePreferences(currentUser.preferences));
        setEmergencyContact(currentUser.emergencyContactNumber || "");

        try {
          const response = await fetch(
            `${API_BASE_URL}/api/check-emergency-contact?uid=${currentUser.uid}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.has_emergency_contact && data.emergency_contact_number) {
              setEmergencyContact(data.emergency_contact_number);
            }
          }
        } catch (fetchError) {
          console.warn(
            "Unable to load emergency contact from backend:",
            fetchError,
          );
        }
      } catch (loadError) {
        console.error("Error loading account page:", loadError);
        setError("Unable to load your account details right now.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handlePreferenceChange = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMessage("");
  };

  const handleTimeToggle = (time) => {
    setPreferences((prev) => ({
      ...prev,
      transportTimes: {
        ...prev.transportTimes,
        [time]: !prev.transportTimes[time],
      },
    }));
    setError("");
    setMessage("");
  };

  const handleSavePreferences = async () => {
    setError("");
    setMessage("");

    if (!profile?.uid) {
      setError("Please sign in again to update your preferences.");
      return;
    }

    if (
      !preferences.gender ||
      !preferences.ageGroup ||
      !preferences.transportMode
    ) {
      setError(
        "Please complete gender, age group, and transport mode before saving.",
      );
      return;
    }

    const hasTimeSelected = Object.values(preferences.transportTimes).some(
      Boolean,
    );
    if (!hasTimeSelected) {
      setError("Select at least one travel time period.");
      return;
    }

    setSavingPreferences(true);
    try {
      const result = await updateUserPreferences(profile.uid, {
        preferences,
      });

      if (!result.success) {
        throw new Error(result.message || "Unable to save preferences");
      }

      setProfile((prev) =>
        prev
          ? { ...prev, preferences: normalizePreferences(preferences) }
          : prev,
      );
      setMessage("Preferences saved successfully.");
    } catch (saveError) {
      console.error("Error saving preferences:", saveError);
      setError(saveError.message || "Unable to save preferences.");
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSaveEmergencyContact = async () => {
    setError("");
    setMessage("");

    if (!profile?.uid) {
      setError("Please sign in again to update your emergency contact.");
      return;
    }

    const phone = emergencyContact.trim();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone || phoneDigits.length < 10) {
      setError(
        "Please enter a valid emergency contact number with at least 10 digits.",
      );
      return;
    }

    setSavingContact(true);
    try {
      const authUser = auth.currentUser;
      const token = authUser ? await authUser.getIdToken() : null;

      const response = await fetch(
        `${API_BASE_URL}/api/update-emergency-contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            uid: profile.uid,
            emergency_contact_number: phone,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.detail || "Unable to save emergency contact");
      }

      const firestoreResult = await updateUserPreferences(profile.uid, {
        emergencyContactNumber: phone,
      });

      if (!firestoreResult.success) {
        console.warn(
          "Emergency contact saved to backend, but Firestore sync failed:",
          firestoreResult.message,
        );
      }

      setProfile((prev) =>
        prev ? { ...prev, emergencyContactNumber: phone } : prev,
      );
      setMessage("Emergency contact saved successfully.");
    } catch (saveError) {
      console.error("Error saving emergency contact:", saveError);
      setError(saveError.message || "Unable to save emergency contact.");
    } finally {
      setSavingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="text-lg font-semibold">Loading your account...</p>
          <p className="text-sm text-slate-400">
            Fetching your profile and preferences
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_36%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#020617_100%)] text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Manage your profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Update your travel preferences and emergency contact from one
              place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.JOURNEY_PLANNER)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Back to map
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/20">
                {profile?.fullName
                  ? profile.fullName
                      .split(" ")
                      .map((namePart) => namePart[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-semibold text-white">
                  {profile?.fullName || "User"}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-400">
                  {profile?.email || "No email available"}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                    Credits: {profile?.credits ?? 250000}
                  </span>
                  <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1">
                    Emergency contact:{" "}
                    {profile?.emergencyContactNumber || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Profile status
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {preferences.gender &&
                  preferences.ageGroup &&
                  preferences.transportMode
                    ? "Preferences saved"
                    : "Preferences incomplete"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Keep these updated for a more personalized safety experience.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Emergency contact
                </p>
                <p className="mt-2 text-base font-semibold text-white">
                  {emergencyContact || "No contact saved"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  SOS alerts will be routed to this number.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              Use the right-hand panels to edit your details. Each section saves
              independently, so you can update only what changed.
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
                    Preferences
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Travel profile
                  </h3>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
                  Saved in account
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Gender
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {["Male", "Female", "Other"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handlePreferenceChange("gender", option)}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          preferences.gender === option
                            ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                            : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-cyan-300/40 hover:bg-white/5"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Age group
                  </label>
                  <select
                    value={preferences.ageGroup}
                    onChange={(event) =>
                      handlePreferenceChange("ageGroup", event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  >
                    <option value="">Select your age group</option>
                    <option value="13-17">13 - 17</option>
                    <option value="18-25">18 - 25</option>
                    <option value="26-35">26 - 35</option>
                    <option value="36-45">36 - 45</option>
                    <option value="46-55">46 - 55</option>
                    <option value="56+">56+</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Transport mode
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {["Walking", "Transport"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          handlePreferenceChange("transportMode", option)
                        }
                        className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                          preferences.transportMode === option
                            ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                            : "border-white/10 bg-slate-950/50 text-slate-300 hover:border-cyan-300/40 hover:bg-white/5"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Travel times
                    </label>
                    <span className="text-xs text-slate-500">
                      Choose all that apply
                    </span>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    {[
                      { id: "morning", label: "Morning (6 AM - 12 PM)" },
                      { id: "afternoon", label: "Afternoon (12 PM - 6 PM)" },
                      { id: "evening", label: "Evening (6 PM - 9 PM)" },
                      { id: "night", label: "Night (9 PM - 6 AM)" },
                    ].map((time) => (
                      <label
                        key={time.id}
                        className="flex cursor-pointer items-center gap-3 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={preferences.transportTimes[time.id]}
                          onChange={() => handleTimeToggle(time.id)}
                          className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-400"
                        />
                        <span>{time.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSavePreferences}
                disabled={savingPreferences}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingPreferences
                  ? "Saving preferences..."
                  : "Save preferences"}
              </button>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">
                  Emergency contact
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  SOS destination number
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  This number receives alerts when you use SOS.
                </p>
              </div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                Phone number
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(event) => setEmergencyContact(event.target.value)}
                placeholder="Enter a phone number with country code"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
              <p className="mt-2 text-xs text-slate-500">
                Use a reachable number with at least 10 digits.
              </p>

              <button
                type="button"
                onClick={handleSaveEmergencyContact}
                disabled={savingContact}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingContact ? "Saving contact..." : "Save emergency contact"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
