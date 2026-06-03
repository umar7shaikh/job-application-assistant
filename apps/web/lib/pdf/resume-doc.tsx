import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { MasterProfile, ResumeAccent } from "@builder/shared";
import {
  MailIcon,
  PhoneIcon,
  PinIcon,
  GlobeIcon,
  LinkedinIcon,
  GithubIcon,
} from "./icons";

const INK = "#14171C";
const SOFT = "#4A4F57";
const LINE = "#D2D4CD";
const TINT = "#F4F5F2";

const ACCENTS: Record<ResumeAccent, string> = {
  green: "#0E6E55",
  blue: "#1D4ED8",
  slate: "#334155",
  plum: "#6D28D9",
  burgundy: "#9F1239",
};

const SIDEBAR_W = "34%";

/**
 * Styles are derived from a `scale` factor so the whole resume can shrink or
 * grow uniformly to fit a target page count without ever looking "messed up"
 * — every size, gap, and margin scales together. `accent` recolors headings.
 */
function makeStyles(scale: number, accent: string) {
  const n = (v: number) => Math.round(v * scale * 100) / 100;
  return StyleSheet.create({
    page: {
      paddingTop: n(38),
      paddingBottom: n(38),
      paddingHorizontal: n(48),
      fontSize: n(9.5),
      fontFamily: "Helvetica",
      color: INK,
      lineHeight: 1.38,
    },
    // Sidebar template renders a full-bleed tinted panel (see sidebarBg), so it
    // manages its own horizontal padding per column and has none on the page.
    pageSidebar: {
      paddingVertical: n(34),
      paddingHorizontal: 0,
      fontSize: n(9.5),
      fontFamily: "Helvetica",
      color: INK,
      lineHeight: 1.36,
    },
    sidebarBg: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: SIDEBAR_W,
      backgroundColor: TINT,
    },
    name: {
      fontSize: n(20),
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.2,
      lineHeight: 1.15,
    },
    nameMain: {
      fontSize: n(19),
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.2,
      lineHeight: 1.15,
    },
    headline: {
      fontSize: n(11),
      color: accent,
      fontFamily: "Helvetica-Oblique",
      lineHeight: 1.2,
      marginTop: n(3),
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: n(6),
    },
    contactStack: { marginTop: n(2) },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: n(14),
      marginBottom: n(3),
    },
    contactText: { fontSize: n(8.5), color: SOFT, marginLeft: n(4) },
    headRule: {
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
      marginTop: n(10),
      marginBottom: n(10),
    },
    mainRule: {
      borderBottomWidth: 1.5,
      borderBottomColor: accent,
      marginTop: n(8),
      marginBottom: n(10),
    },
    sectionTitle: {
      fontSize: n(9),
      fontFamily: "Helvetica-Bold",
      color: accent,
      textTransform: "uppercase",
      letterSpacing: 1,
      paddingBottom: n(2),
      marginBottom: n(6),
      borderBottomWidth: 0.75,
      borderBottomColor: LINE,
    },
    section: { marginBottom: n(10) },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    itemTitle: { fontFamily: "Helvetica-Bold", fontSize: n(10) },
    // Row variant: flex:1 lets a long title wrap instead of colliding with the
    // link/date; padding keeps a gap, and the right element never shrinks.
    // (Only use inside a rowBetween — flex:1 breaks a stacked/column block.)
    itemTitleRow: {
      fontFamily: "Helvetica-Bold",
      fontSize: n(10),
      flex: 1,
      paddingRight: n(8),
    },
    itemSub: { color: SOFT, fontSize: n(9) },
    tech: {
      color: SOFT,
      fontSize: n(8.5),
      fontFamily: "Helvetica-Oblique",
      marginBottom: n(1),
    },
    dates: { color: SOFT, fontSize: n(8.5), flexShrink: 0, textAlign: "right" },
    dateLeft: { color: SOFT, fontSize: n(8.5) },
    linkTag: {
      color: accent,
      fontSize: n(8.5),
      fontFamily: "Helvetica-Bold",
      flexShrink: 0,
      textDecoration: "underline",
    },
    bullet: { flexDirection: "row", marginTop: n(2) },
    bulletDot: { width: n(10), color: accent },
    bulletText: { flex: 1 },
    summary: { fontSize: n(9.5) },
    skillRow: { flexDirection: "row", marginBottom: n(3) },
    skillCat: { fontFamily: "Helvetica-Bold", width: n(110) },
    skillCatStack: { fontFamily: "Helvetica-Bold", marginBottom: n(1) },
    skillVals: { flex: 1 },
    block: { marginBottom: n(8) },
    columns: { flexDirection: "row" },
    sidebar: { width: SIDEBAR_W, paddingHorizontal: n(16) },
    main: { width: "66%", paddingHorizontal: n(18) },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function Section({
  title,
  styles,
  children,
}: {
  title: string;
  styles: Styles;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function pretty(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function href(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}
/** A short label that hides the raw URL, the way LaTeX résumés do. */
function projectLinkLabel(url: string): string {
  if (/github\.com/i.test(url)) return "GitHub";
  if (/gitlab\.com/i.test(url)) return "GitLab";
  return "Live";
}

/* ----------------------------------------------------------- shared pieces */

function ContactItem({
  icon,
  text,
  href: link,
  styles,
}: {
  icon: React.ReactNode;
  text: string;
  href?: string;
  styles: Styles;
}) {
  const label = <Text style={styles.contactText}>{text}</Text>;
  return (
    <View style={styles.contactItem}>
      {icon}
      {link ? (
        <Link src={link} style={{ textDecoration: "none" }}>
          {label}
        </Link>
      ) : (
        label
      )}
    </View>
  );
}

/** Contact rows. Links show clean labels (LinkedIn/GitHub) instead of URLs. */
function ContactItems({
  c,
  styles,
  iconSize,
}: {
  c: MasterProfile["contact"];
  styles: Styles;
  iconSize: number;
}) {
  return (
    <>
      {c.email ? (
        <ContactItem
          styles={styles}
          icon={<MailIcon size={iconSize} color={SOFT} />}
          text={c.email}
          href={`mailto:${c.email}`}
        />
      ) : null}
      {c.phone ? (
        <ContactItem
          styles={styles}
          icon={<PhoneIcon size={iconSize} color={SOFT} />}
          text={c.phone}
        />
      ) : null}
      {c.location ? (
        <ContactItem
          styles={styles}
          icon={<PinIcon size={iconSize} color={SOFT} />}
          text={c.location}
        />
      ) : null}
      {c.linkedin ? (
        <ContactItem
          styles={styles}
          icon={<LinkedinIcon size={iconSize} color={SOFT} />}
          text="LinkedIn"
          href={href(c.linkedin)}
        />
      ) : null}
      {c.github ? (
        <ContactItem
          styles={styles}
          icon={<GithubIcon size={iconSize} color={SOFT} />}
          text="GitHub"
          href={href(c.github)}
        />
      ) : null}
      {c.website ? (
        <ContactItem
          styles={styles}
          icon={<GlobeIcon size={iconSize} color={SOFT} />}
          text={pretty(c.website)}
          href={href(c.website)}
        />
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------- section bodies */

function ExperienceBody({ p, s }: { p: MasterProfile; s: Styles }) {
  return (
    <>
      {p.experience.map((e, i) => (
        <View key={i} style={s.block} wrap={false}>
          <View style={s.rowBetween}>
            <Text style={s.itemTitleRow}>
              {e.title}
              {e.company ? ` — ${e.company}` : ""}
            </Text>
            <Text style={s.dates}>
              {[e.startDate, e.current ? "Present" : e.endDate]
                .filter(Boolean)
                .join(" – ")}
            </Text>
          </View>
          {e.location ? <Text style={s.itemSub}>{e.location}</Text> : null}
          {e.bullets.map((b, j) => (
            <View key={j} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function ProjectsBody({ p, s }: { p: MasterProfile; s: Styles }) {
  return (
    <>
      {p.projects.map((pr, i) => (
        <View key={i} style={s.block} wrap={false}>
          <View style={s.rowBetween}>
            <Text style={s.itemTitleRow}>{pr.name}</Text>
            {pr.url ? (
              <Link src={href(pr.url)} style={s.linkTag}>
                {projectLinkLabel(pr.url)}
              </Link>
            ) : null}
          </View>
          {/* Tech stack sits right under the heading so it reads as a subtitle. */}
          {pr.technologies.length > 0 ? (
            <Text style={s.tech}>{pr.technologies.join(" · ")}</Text>
          ) : null}
          {pr.description ? (
            <Text style={s.itemSub}>{pr.description}</Text>
          ) : null}
          {pr.bullets.map((b, j) => (
            <View key={j} style={s.bullet}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

function SkillsBody({
  p,
  s,
  stack,
}: {
  p: MasterProfile;
  s: Styles;
  stack?: boolean;
}) {
  return (
    <>
      {p.skills.map((g, i) =>
        stack ? (
          <View key={i} style={s.block}>
            <Text style={s.skillCatStack}>{g.category}</Text>
            <Text>{g.skills.join(", ")}</Text>
          </View>
        ) : (
          <View key={i} style={s.skillRow}>
            <Text style={s.skillCat}>{g.category}</Text>
            <Text style={s.skillVals}>{g.skills.join(", ")}</Text>
          </View>
        )
      )}
    </>
  );
}

function EducationBody({ p, s }: { p: MasterProfile; s: Styles }) {
  return (
    <>
      {p.education.map((e, i) => (
        <View key={i} style={s.block} wrap={false}>
          <Text style={s.itemTitle}>
            {[e.degree, e.field].filter(Boolean).join(", ")}
          </Text>
          <Text style={s.itemSub}>
            {[e.institution, e.gpa && `GPA ${e.gpa}`].filter(Boolean).join("  ·  ")}
          </Text>
          <Text style={s.dateLeft}>
            {[e.startDate, e.endDate].filter(Boolean).join(" – ")}
          </Text>
        </View>
      ))}
    </>
  );
}

function MoreBody({ p, s }: { p: MasterProfile; s: Styles }) {
  return (
    <>
      {p.certifications.length > 0 ? (
        <Text style={s.itemSub}>
          Certifications: {p.certifications.join(", ")}
        </Text>
      ) : null}
      {p.languages.length > 0 ? (
        <Text style={s.itemSub}>Languages: {p.languages.join(", ")}</Text>
      ) : null}
    </>
  );
}

function BulletList({ items, s }: { items: string[]; s: Styles }) {
  return (
    <>
      {items.map((line, j) => (
        <View key={j} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{line}</Text>
        </View>
      ))}
    </>
  );
}

function CustomSections({ p, s }: { p: MasterProfile; s: Styles }) {
  return (
    <>
      {p.customSections.map((sec, i) =>
        sec.title || sec.items.length ? (
          <Section key={i} title={sec.title || "More"} styles={s}>
            <BulletList items={sec.items} s={s} />
          </Section>
        ) : null
      )}
    </>
  );
}

/* ---------------------------------------------------------------- layouts */

function ClassicLayout({
  p,
  s,
  iconSize,
}: {
  p: MasterProfile;
  s: Styles;
  iconSize: number;
}) {
  return (
    <Page size="A4" style={s.page}>
      <View>
        <Text style={s.name}>{p.contact.fullName || "Your Name"}</Text>
        {p.contact.headline ? (
          <Text style={s.headline}>{p.contact.headline}</Text>
        ) : null}
        <View style={s.contactRow}>
          <ContactItems c={p.contact} styles={s} iconSize={iconSize} />
        </View>
      </View>
      <View style={s.headRule} />
      {p.summary && p.layout.showSummary ? (
        <Section title="Summary" styles={s}>
          <Text style={s.summary}>{p.summary}</Text>
        </Section>
      ) : null}
      {p.experience.length > 0 ? (
        <Section title="Experience" styles={s}>
          <ExperienceBody p={p} s={s} />
        </Section>
      ) : null}
      {p.projects.length > 0 ? (
        <Section title="Projects" styles={s}>
          <ProjectsBody p={p} s={s} />
        </Section>
      ) : null}
      {p.skills.length > 0 ? (
        <Section title="Skills" styles={s}>
          <SkillsBody p={p} s={s} />
        </Section>
      ) : null}
      {p.education.length > 0 ? (
        <Section title="Education" styles={s}>
          <EducationBody p={p} s={s} />
        </Section>
      ) : null}
      {p.certifications.length > 0 || p.languages.length > 0 ? (
        <Section title="More" styles={s}>
          <MoreBody p={p} s={s} />
        </Section>
      ) : null}
      <CustomSections p={p} s={s} />
    </Page>
  );
}

function SidebarLayout({
  p,
  s,
  iconSize,
}: {
  p: MasterProfile;
  s: Styles;
  iconSize: number;
}) {
  return (
    <Page size="A4" style={s.pageSidebar}>
      {/* Full-height tinted panel behind the sidebar so short content never
          leaves an awkward white gap; `fixed` repeats it on every page. */}
      <View style={s.sidebarBg} fixed />
      <View style={s.columns}>
        <View style={s.sidebar}>
          <Section title="Contact" styles={s}>
            <View style={s.contactStack}>
              <ContactItems c={p.contact} styles={s} iconSize={iconSize} />
            </View>
          </Section>
          {p.skills.length > 0 ? (
            <Section title="Skills" styles={s}>
              <SkillsBody p={p} s={s} stack />
            </Section>
          ) : null}
          {p.education.length > 0 ? (
            <Section title="Education" styles={s}>
              <EducationBody p={p} s={s} />
            </Section>
          ) : null}
          {p.certifications.length > 0 ? (
            <Section title="Certifications" styles={s}>
              <BulletList items={p.certifications} s={s} />
            </Section>
          ) : null}
          {p.languages.length > 0 ? (
            <Section title="Languages" styles={s}>
              <Text style={s.itemSub}>{p.languages.join(", ")}</Text>
            </Section>
          ) : null}
        </View>
        <View style={s.main}>
          <Text style={s.nameMain}>{p.contact.fullName || "Your Name"}</Text>
          {p.contact.headline ? (
            <Text style={s.headline}>{p.contact.headline}</Text>
          ) : null}
          <View style={s.mainRule} />
          {p.summary && p.layout.showSummary ? (
            <Section title="Summary" styles={s}>
              <Text style={s.summary}>{p.summary}</Text>
            </Section>
          ) : null}
          {p.experience.length > 0 ? (
            <Section title="Experience" styles={s}>
              <ExperienceBody p={p} s={s} />
            </Section>
          ) : null}
          {p.projects.length > 0 ? (
            <Section title="Projects" styles={s}>
              <ProjectsBody p={p} s={s} />
            </Section>
          ) : null}
          <CustomSections p={p} s={s} />
        </View>
      </View>
    </Page>
  );
}

export function ResumeDoc({
  profile,
  scale = 1,
}: {
  profile: MasterProfile;
  scale?: number;
}) {
  const accent = ACCENTS[profile.layout.accent] ?? ACCENTS.green;
  const s = makeStyles(scale, accent);
  const iconSize = Math.round(9 * scale * 100) / 100;
  const c = profile.contact;

  return (
    <Document title={c.fullName || "Resume"} author={c.fullName || "Resume"}>
      {profile.layout.template === "sidebar" ? (
        <SidebarLayout p={profile} s={s} iconSize={iconSize} />
      ) : (
        <ClassicLayout p={profile} s={s} iconSize={iconSize} />
      )}
    </Document>
  );
}

/** Factory so non-JSX route handlers can build the element cleanly. */
export const resumeElement = (profile: MasterProfile, scale = 1) => (
  <ResumeDoc profile={profile} scale={scale} />
);
