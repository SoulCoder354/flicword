import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserStats, LEVEL_XP, type UserStats } from "@/lib/userData";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, LogOut, Sparkles, Pencil, Image as ImageIcon, CameraIcon } from "lucide-react";
import { toast } from "sonner";

const APP_VERSION = "Flicword v1.0";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.flicword.app";
const GOAL_OPTIONS = [6, 10, 20];

const rankFor = (level: number) => {
  if (level >= 20) return "Wordsmith";
  if (level >= 10) return "Linguist";
  if (level >= 5) return "Scholar";
  if (level >= 2) return "Apprentice";
  return "Novice";
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserStats(user.id).then(setStats);
    supabase.from("sessions").select("topic").eq("user_id", user.id).then(({ data }) => {
      const rows = data ?? [];
      setTotalSessions(rows.length);
    });
  }, [user]);

  const xp = stats?.totalXp ?? 0;
  const level = stats?.level ?? 0;
  const xpInLevel = xp % LEVEL_XP;
  const progress = (xpInLevel / LEVEL_XP) * 100;

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setPickerOpen(false);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("users").update({ avatar_url: data.publicUrl }).eq("id", user.id);
      if (dbErr) throw dbErr;
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const updateGoal = async (goal: number) => {
    if (!user) return;
    setGoalOpen(false);
    const { error } = await supabase.from("users").update({ daily_goal: goal }).eq("id", user.id);
    if (error) return toast.error("Could not save");
    await refreshProfile();
    toast.success(`Daily goal set to ${goal} words`);
  };

  const toggleReminder = async (enabled: boolean) => {
    if (!user) return;
    await supabase.from("users").update({ reminder_enabled: enabled }).eq("id", user.id);
    await refreshProfile();
  };

  const updateReminderTime = async (time: string) => {
    if (!user) return;
    await supabase.from("users").update({ reminder_time: time }).eq("id", user.id);
    await refreshProfile();
  };

  const submitFeedback = async () => {
    if (!user || !feedback.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message: feedback.trim() });
    setSubmitting(false);
    if (error) return toast.error("Could not send feedback.");
    setFeedback("");
    toast.success("Feedback sent. Thank you!");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <AppShell>
      <header className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-4">
          <Avatar url={profile?.avatar_url} name={profile?.name} email={user?.email} size={96} />
          <button
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-glow border-2 border-background press disabled:opacity-50"
            aria-label="Change profile picture"
          >
            <Camera className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        <h1 className="text-3xl font-bold">{profile?.name ?? "Anonymous"}</h1>
        <div className="mt-2 inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Level {level} · {rankFor(level)}
        </div>
        <p className="text-xs text-foreground/50 mt-2">{user?.email}</p>
      </header>

      {/* XP Progress */}
      <section className="glass-strong rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="eyebrow">Progress</p>
          <p className="text-xs text-muted-foreground">{xpInLevel} / {LEVEL_XP} XP</p>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {/* Learning Stats */}
      <section className="card-featured rounded-2xl p-5 mb-4">
        <p className="eyebrow mb-4">Learning Stats</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total Words", value: stats?.totalWordsCount ?? 0 },
            { label: "Sessions", value: totalSessions },
            { label: "Best Streak", value: stats?.longestStreak ?? 0 },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-primary tabular-nums">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Goal */}
      <section className="glass rounded-2xl p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Daily Goal</p>
          <p className="text-xs text-muted-foreground mt-0.5">{profile?.daily_goal ?? 10} words per day</p>
        </div>
        <button onClick={() => setGoalOpen(true)} className="h-9 w-9 rounded-full bg-card border border-border grid place-items-center press" aria-label="Edit goal">
          <Pencil className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </button>
      </section>

      {/* Notifications */}
      <section className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Daily Reminder</p>
            <p className="text-xs text-muted-foreground mt-0.5">Get a nudge to keep your streak</p>
          </div>
          <Switch checked={!!profile?.reminder_enabled} onCheckedChange={toggleReminder} />
        </div>
        {profile?.reminder_enabled && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm">Reminder time</p>
            <input
              type="time"
              value={profile?.reminder_time ?? "19:00"}
              onChange={(e) => updateReminderTime(e.target.value)}
              className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
            />
          </div>
        )}
      </section>

      {/* Feedback */}
      <section className="glass-strong rounded-2xl p-4 mb-4">
        <p className="eyebrow mb-2">Send us feedback</p>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think..."
          rows={3}
          className="w-full bg-transparent resize-none text-sm placeholder:text-muted-foreground outline-none"
        />
        <button
          onClick={submitFeedback}
          disabled={!feedback.trim() || submitting}
          className="mt-2 w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold press disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Submit"}
        </button>
      </section>

      <button
        onClick={handleSignOut}
        className="w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm font-semibold press"
        style={{ background: "hsl(var(--destructive) / 0.18)", color: "hsl(var(--destructive))" }}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>

      {/* App version */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-xs text-muted-foreground">{APP_VERSION}</p>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary-glow font-semibold inline-block"
        >
          Rate us on Play Store
        </a>
      </div>

      {/* Hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFileChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFileChange} />

      {/* Photo source picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <button
              onClick={() => galleryRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-background border border-border press hover:border-primary/40"
            >
              <ImageIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Choose from Gallery</span>
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-background border border-border press hover:border-primary/40"
            >
              <CameraIcon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Take Photo</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal picker */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Daily Word Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {GOAL_OPTIONS.map((g) => {
              const active = (profile?.daily_goal ?? 10) === g;
              return (
                <button
                  key={g}
                  onClick={() => updateGoal(g)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border press ${
                    active ? "border-primary bg-primary/10" : "border-border bg-background"
                  }`}
                >
                  <span className="text-sm font-semibold">{g} words per day</span>
                  {active && <span className="text-xs text-primary font-bold">SELECTED</span>}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Profile;
