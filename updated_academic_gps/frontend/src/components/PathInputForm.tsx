import { FormEvent, useState } from "react";
import { demoProfile } from "../data/demoProfile";
import { UserProfile } from "../types";

type Props = {
  onStart: (profile: UserProfile) => Promise<void>;
  loading: boolean;
};

export function PathInputForm({ onStart, loading }: Props) {
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [drafts, setDrafts] = useState({
    skills: demoProfile.skills.join(", "),
    interests: demoProfile.interests.join(", "),
    desired_careers: demoProfile.desired_careers.join(", "),
    desired_opportunities: demoProfile.desired_opportunities.join(", "),
    desired_skills: demoProfile.desired_skills.join(", "),
  });

  const setList = (key: keyof UserProfile, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    setProfile((current) => ({
      ...current,
      [key]: value.split(",").map((item) => item.trim()).filter(Boolean)
    }));
  };

  const loadDemo = () => {
    setProfile(demoProfile);
    setDrafts({
      skills: demoProfile.skills.join(", "),
      interests: demoProfile.interests.join(", "),
      desired_careers: demoProfile.desired_careers.join(", "),
      desired_opportunities: demoProfile.desired_opportunities.join(", "),
      desired_skills: demoProfile.desired_skills.join(", "),
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onStart(profile);
  };

  return (
    <div className="flex h-full items-center justify-center px-6 py-8">
      <form onSubmit={handleSubmit} className="glass w-full max-w-4xl rounded-[28px] p-6 shadow-glow">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-sky-300/80">Academic GPS</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Build your path by stepping through possibility bubbles.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Start with your skills, interests, and ambitions. We&apos;ll turn that into a spatial branching map you can grow, revisit, and summarize.
            </p>
          </div>
          <button
            type="button"
            onClick={loadDemo}
            className="rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-sm text-slate-100 transition hover:bg-white/[0.12]"
          >
            Load demo profile
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Skills" value={drafts.skills} onChange={(value) => setList("skills", value)} />
          <Field label="Interests" value={drafts.interests} onChange={(value) => setList("interests", value)} />
          <Field label="Desired careers" value={drafts.desired_careers} onChange={(value) => setList("desired_careers", value)} />
          <Field label="Desired opportunities" value={drafts.desired_opportunities} onChange={(value) => setList("desired_opportunities", value)} />
          <div className="md:col-span-2">
            <Field label="Desired skills to build" value={drafts.desired_skills} onChange={(value) => setList("desired_skills", value)} />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-slate-400">Designed for a compact laptop demo: map-first, fluid, and branchable.</p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading ? "Opening map..." : "Enter pathway map"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/12 bg-white/[0.08] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/60 focus:bg-white/[0.12]"
      />
    </label>
  );
}
