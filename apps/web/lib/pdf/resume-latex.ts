import "server-only";
import type { MasterProfile } from "@builder/shared";

/**
 * Render a profile to LaTeX SOURCE (not compiled). The user compiles it in
 * Overleaf / their own toolchain. Uses only standard packages so it builds with
 * pdflatex out of the box.
 */

function esc(s: string): string {
  return (s ?? "")
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

const PREAMBLE = `\\documentclass[11pt]{article}
\\usepackage[margin=1.5cm]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\definecolor{accent}{HTML}{0E6E55}
\\titleformat{\\section}{\\large\\bfseries\\color{accent}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{4pt}
\\setlist[itemize]{leftmargin=1.2em, itemsep=1pt, topsep=2pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}
`;

export function resumeToLatex(p: MasterProfile): string {
  const c = p.contact;
  const out: string[] = [PREAMBLE, "\\begin{document}", ""];

  const contactBits = [c.email, c.phone, c.location, c.linkedin, c.website]
    .filter(Boolean)
    .map(esc)
    .join(" $\\cdot$ ");
  out.push("\\begin{center}");
  out.push(`{\\LARGE \\textbf{${esc(c.fullName || "Your Name")}}}\\\\[3pt]`);
  if (c.headline) out.push(`{\\itshape ${esc(c.headline)}}\\\\[3pt]`);
  if (contactBits) out.push(`\\small ${contactBits}`);
  out.push("\\end{center}", "");

  if (p.summary) {
    out.push("\\section*{Summary}", esc(p.summary), "");
  }

  if (p.experience.length) {
    out.push("\\section*{Experience}");
    for (const e of p.experience) {
      const dates = [e.startDate, e.current ? "Present" : e.endDate]
        .filter(Boolean)
        .map(esc)
        .join(" -- ");
      const head = `\\textbf{${esc(e.title)}}${
        e.company ? ` — ${esc(e.company)}` : ""
      } \\hfill ${dates}\\\\`;
      out.push(head);
      if (e.location) out.push(`\\textit{${esc(e.location)}}\\\\`);
      if (e.bullets.length) {
        out.push("\\begin{itemize}");
        for (const b of e.bullets) out.push(`\\item ${esc(b)}`);
        out.push("\\end{itemize}");
      }
      out.push("\\smallskip");
    }
    out.push("");
  }

  if (p.projects.length) {
    out.push("\\section*{Projects}");
    for (const pr of p.projects) {
      out.push(
        `\\textbf{${esc(pr.name)}}${
          pr.technologies.length ? ` \\hfill \\textit{${esc(pr.technologies.join(", "))}}` : ""
        }\\\\`
      );
      if (pr.description) out.push(`${esc(pr.description)}\\\\`);
      if (pr.bullets.length) {
        out.push("\\begin{itemize}");
        for (const b of pr.bullets) out.push(`\\item ${esc(b)}`);
        out.push("\\end{itemize}");
      }
      out.push("\\smallskip");
    }
    out.push("");
  }

  if (p.skills.length) {
    out.push("\\section*{Skills}");
    for (const g of p.skills) {
      out.push(`\\textbf{${esc(g.category)}:} ${esc(g.skills.join(", "))}\\\\`);
    }
    out.push("");
  }

  if (p.education.length) {
    out.push("\\section*{Education}");
    for (const e of p.education) {
      const dates = [e.startDate, e.endDate].filter(Boolean).map(esc).join(" -- ");
      out.push(
        `\\textbf{${esc([e.degree, e.field].filter(Boolean).join(", "))}} \\hfill ${dates}\\\\`
      );
      out.push(
        `${esc(e.institution)}${e.gpa ? ` $\\cdot$ GPA ${esc(e.gpa)}` : ""}`
      );
      out.push("\\smallskip");
    }
    out.push("");
  }

  if (p.certifications.length || p.languages.length) {
    out.push("\\section*{More}");
    if (p.certifications.length)
      out.push(`\\textbf{Certifications:} ${esc(p.certifications.join(", "))}\\\\`);
    if (p.languages.length)
      out.push(`\\textbf{Languages:} ${esc(p.languages.join(", "))}`);
    out.push("");
  }

  for (const sec of p.customSections) {
    if (!sec.title && !sec.items.length) continue;
    out.push(`\\section*{${esc(sec.title || "More")}}`);
    if (sec.items.length) {
      out.push("\\begin{itemize}");
      for (const line of sec.items) out.push(`\\item ${esc(line)}`);
      out.push("\\end{itemize}");
    }
    out.push("");
  }

  out.push("\\end{document}", "");
  return out.join("\n");
}

export function coverLetterToLatex(d: {
  name: string;
  contactLine: string;
  body: string;
}): string {
  const paras = d.body
    .split(/\n{2,}/)
    .map((p) => esc(p.trim()).replace(/\n/g, "\\\\\n"))
    .filter(Boolean);
  return `\\documentclass[11pt]{article}
\\usepackage[margin=2cm]{geometry}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{8pt}
\\pagestyle{empty}
\\begin{document}
{\\large \\textbf{${esc(d.name)}}}\\\\
\\small ${esc(d.contactLine)}
\\bigskip

${paras.join("\n\n")}
\\end{document}
`;
}
