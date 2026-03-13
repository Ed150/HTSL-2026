import { FormEvent, useState } from "react";
import { demoProfile } from "../data/demoProfile";
import { UserProfile } from "../types";

type Props = {
  onStart: (profile: UserProfile) => Promise<void>;
  loading: boolean;
};

type DraftLists = {
  skills: string;
  interests: string;
  desired_careers: string;
  desired_opportunities: string;
  desired_skills: string;
  target_industries: string;
  preferred_opportunity_types: string;
};

export function PathInputForm({ onStart, loading }: Props) {
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [drafts, setDrafts] = useState<DraftLists>(makeDrafts(demoProfile));

  const setList = (key: keyof DraftLists, value: string) => {
    setDrafts((current) => ({ ...current, [key]: value }));
    setProfile((current) => ({
      ...current,
      [key]: value.split(",").map((item) => item.trim()).filter(Boolean),
    }));
  };

  const setValue = (key: "campus" | "program" | "year", value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const loadDemo = () => {
    setProfile(demoProfile);
    setDrafts(makeDrafts(demoProfile));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onStart(profile);
  };

  return (
    <div className="flex h-full items-center justify-center px-6 py-8">
      <form onSubmit={handleSubmit} className="glass w-full max-w-5xl rounded-[28px] p-6 shadow-glow">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-start gap-6">
            <img 
              src="/648223734_1219376380348981_176398887528869947_n.png" 
              alt="Ficus Logo" 
              className="h-24 w-auto rounded-xl object-contain"
            />
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-ficus-coral">Academic Discovery at UofT</p>
              <h1 className="text-3xl font-semibold tracking-tight text-ficus-cream">Build your Ficus pathway one opportunity bubble at a time.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ficus-cream/80">
                Start with your campus context, interests, and goals. We&apos;ll turn them into a compact branching map of UofT-relevant labs,
                courses, student communities, work-study leads, and startup pathways.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadDemo}
            className="rounded-full border border-ficus-cream/12 bg-ficus-cream/[0.08] px-4 py-2 text-sm text-ficus-cream transition hover:bg-ficus-cream/[0.12]"
          >
            Load Ficus demo
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Campus" value={profile.campus} onChange={(value) => setValue("campus", value)} options={["St. George", "Scarborough", "Mississauga"]} />
            <Field label="Program or faculty" value={profile.program} onChange={(value) => setValue("program", value)} placeholder="Engineering Science, Rotman, CS, Physics..." />
            <Field label="Year of study" value={profile.year} onChange={(value) => setValue("year", value)} placeholder="First Year, Third Year, MSc..." />
            <Field label="Current skills" value={drafts.skills} onChange={(value) => setList("skills", value)} placeholder="Python, writing, CAD..." />
            <Field label="Interests" value={drafts.interests} onChange={(value) => setList("interests", value)} placeholder="Quantum, fintech, robotics..." />
            <Field label="Desired skills" value={drafts.desired_skills} onChange={(value) => setList("desired_skills", value)} placeholder="Research communication, product sense..." />
          </div>

          <div className="grid gap-4">
            <Field label="Target careers" value={drafts.desired_careers} onChange={(value) => setList("desired_careers", value)} placeholder="Clinical ML researcher, product manager..." />
            <Field label="Preferred opportunity types" value={drafts.preferred_opportunity_types} onChange={(value) => setList("preferred_opportunity_types", value)} placeholder="Lab, design team, work-study..." />
            <Field label="Desired opportunities" value={drafts.desired_opportunities} onChange={(value) => setList("desired_opportunities", value)} placeholder="Research lab, startup hub, workshop..." />
            <Field label="Target industries" value={drafts.target_industries} onChange={(value) => setList("target_industries", value)} placeholder="Biotech, deep tech, fintech..." />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-ficus-cream/60">
            Personalized around UofT opportunities with safe public-data ingestion and local demo fallback.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-ficus-coral via-ficus-lilac to-ficus-plum px-5 py-2.5 text-sm font-medium text-ficus-cream transition hover:scale-[1.01] disabled:opacity-60 shadow-lg"
          >
            {loading ? "Opening map..." : "Enter Ficus pathway map"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-ficus-cream/60">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-ficus-cream/12 bg-ficus-plum/40 px-4 py-3 text-sm text-ficus-cream outline-none transition placeholder:text-ficus-cream/40 focus:border-ficus-coral/60 focus:bg-ficus-plum/60"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-ficus-cream/60">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-ficus-cream/12 bg-ficus-plum/40 px-4 py-3 text-sm text-ficus-cream outline-none transition focus:border-ficus-coral/60 focus:bg-ficus-plum/60"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-ficus-plum">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function makeDrafts(profile: UserProfile): DraftLists {
  return {
    skills: profile.skills.join(", "),
    interests: profile.interests.join(", "),
    desired_careers: profile.desired_careers.join(", "),
    desired_opportunities: profile.desired_opportunities.join(", "),
    desired_skills: profile.desired_skills.join(", "),
    target_industries: profile.target_industries.join(", "),
    preferred_opportunity_types: profile.preferred_opportunity_types.join(", "),
  };
}
