import React from 'react';

const serif = { fontFamily: "'Georgia', 'Times New Roman', serif" };

const AboutView: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b-2 border-[#1a1a1a] pb-5">
        <h2 style={serif} className="text-3xl font-bold text-[#1a1a1a] leading-tight">
          About VeriBias
        </h2>
        <p style={serif} className="text-[13px] text-[#888] italic mt-2">
          Bachelor's Thesis · University of Stavanger · 2026
        </p>
      </div>

      {/* ── What is VeriBias ───────────────────────────────────── */}
      <div className="space-y-3">
        <h3 style={serif} className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
          What is VeriBias?
        </h3>
        <p style={serif} className="text-[14px] text-[#333] leading-relaxed">
          VeriBias is a media bias detection system that uses large language models to analyse
          political framing in news articles. Given any news article, VeriBias evaluates it
          across ten dimensions of journalistic bias — including framing, sensationalism,
          confirmation bias, and source selection — and produces a structured, explainable result.
        </p>
      </div>

      {/* ── Thesis ─────────────────────────────────────────────── */}
      <div className="border border-[#e8e4de] bg-white p-6 space-y-4">
        <h3 style={serif} className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
          The Thesis
        </h3>
        <div className="space-y-2">
          {[
            { label: "Title",       value: "Detecting and Visualising Biases in News Text Using LLMs" },
            { label: "Institution", value: "University of Stavanger (UiS)" },
            { label: "Department",  value: "Department of Electrical Engineering and Computer Science" },
            { label: "Degree",      value: "Bachelor of Science in Computer Science" },
            { label: "Year",        value: "2026" },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4">
              <span style={serif} className="text-[12px] font-bold text-[#888] w-28 shrink-0">{label}</span>
              <span style={serif} className="text-[13px] text-[#333]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Authors ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 style={serif} className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
          Authors
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { name: "Yosuf Al-Ani",    email: "yosani2003@gmail.com",  role: "Student — Computer Science" },
            { name: "Sture Odin Troli", email: "sturetroly1@gmail.com", role: "Student — Computer Science" },
          ].map(({ name, email, role }) => (
            <div key={name} className="border border-[#e8e4de] bg-white p-4">
              <p style={serif} className="text-[14px] font-bold text-[#1a1a1a]">{name}</p>
              <p style={serif} className="text-[12px] text-[#888] italic mt-0.5">{role}</p>
              <p style={serif} className="text-[11px] text-[#aaa] mt-0.5">University of Stavanger</p>
              <a
                href={`mailto:${email}`}
                style={serif}
                className="text-[11px] text-[#888] hover:text-[#1a1a1a] transition-colors mt-1 block"
              >
                {email}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Technology ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 style={serif} className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1a1a1a]">
          Technology
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Python / Flask", "React / TypeScript", "Tailwind CSS", "SQLite",
            "Google Gemini 2.5 Flash", "Anthropic Claude Sonnet",
            "University of Stavanger"].map(tag => (
            <span
              key={tag}
              style={serif}
              className="px-3 py-1 text-[11px] border border-[#e8e4de] text-[#555] bg-[#F8F6F1]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────── */}
      <div className="border-t border-[#e8e4de] pt-6">
        <p style={serif} className="text-[12px] text-[#aaa] italic leading-relaxed">
          VeriBias was developed exclusively for academic research purposes as part of a
          bachelor's thesis at the University of Stavanger. The bias scores produced by this
          system reflect the output of AI language models and do not represent the views of
          the authors or the university. Results should be interpreted in the context of the
          limitations discussed in the thesis.
        </p>
      </div>

    </div>
  );
};

export default AboutView;