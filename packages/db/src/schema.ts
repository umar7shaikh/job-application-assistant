import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type {
  MasterProfile,
  JdAnalysis,
  FitAnalysis,
  ApplicationStatus,
} from "@builder/shared";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp("created_at", { mode: "date" }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { mode: "date" }).notNull().defaultNow();

/* ----------------------------------------------------------------- Users */
// Auth is a custom stateless JWT-cookie session (jose) — no adapter tables.

export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  // bcrypt hash of the user's password.
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

/* --------------------------------------------------------- BYO API keys */

export const userSecrets = pgTable("user_secrets", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // AES-256-GCM encrypted blobs (never stored or logged in plaintext).
  apifyKeyEnc: text("apify_key_enc"),
  rapidapiKeyEnc: text("rapidapi_key_enc"), // for JSearch job API
  aiProvider: text("ai_provider"),
  aiKeyEnc: text("ai_key_enc"),
  updatedAt: updatedAt(),
});

/* ---------------------------------------------------------- Resumes */

export const masterProfiles = pgTable(
  "master_profiles",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("My Resume"),
    data: jsonb("data").$type<MasterProfile>().notNull(),
    sourceFileName: text("source_file_name"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("master_profiles_user_idx").on(t.userId)]
);

/* ---------------------------------------------------------- Job scraping */

export const scrapeRuns = pgTable("scrape_runs", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  query: jsonb("query").$type<Record<string, unknown>>().notNull(),
  apifyRunId: text("apify_run_id"),
  status: text("status").notNull().default("pending"), // pending|running|succeeded|failed
  jobCount: integer("job_count").notNull().default(0),
  error: text("error"),
  createdAt: createdAt(),
  finishedAt: timestamp("finished_at", { mode: "date" }),
});

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scrapeRunId: text("scrape_run_id").references(() => scrapeRuns.id, {
      onDelete: "set null",
    }),
    source: text("source").notNull(),
    sourceJobId: text("source_job_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull().default(""),
    url: text("url").notNull(),
    remote: boolean("remote").notNull().default(false),
    jdText: text("jd_text").notNull().default(""),
    salary: text("salary").notNull().default(""),
    postedAt: text("posted_at").notNull().default(""),
    jdAnalysis: jsonb("jd_analysis").$type<JdAnalysis>(),
    scrapedAt: createdAt(),
  },
  (t) => [
    // Dedupe: one job per source per user.
    uniqueIndex("jobs_user_source_uq").on(t.userId, t.source, t.sourceJobId),
    index("jobs_user_idx").on(t.userId),
  ]
);

export const jobMatches = pgTable(
  "job_matches",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    profileId: text("profile_id")
      .notNull()
      .references(() => masterProfiles.id, { onDelete: "cascade" }),
    fit: jsonb("fit").$type<FitAnalysis>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("job_matches_job_profile_uq").on(t.jobId, t.profileId)]
);

/* -------------------------------------------------- Tailored documents */

export const tailoredDocuments = pgTable("tailored_documents", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobId: text("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  profileId: text("profile_id")
    .notNull()
    .references(() => masterProfiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "resume" | "cover_letter"
  content: jsonb("content")
    .$type<MasterProfile | { body: string; name: string; contactLine: string }>()
    .notNull(),
  pdfPath: text("pdf_path"),
  createdAt: createdAt(),
});

/* --------------------------------------------------- Application history */

export const applications = pgTable(
  "applications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => masterProfiles.id, {
      onDelete: "set null",
    }),
    resumeDocId: text("resume_doc_id").references(() => tailoredDocuments.id, {
      onDelete: "set null",
    }),
    coverDocId: text("cover_doc_id").references(() => tailoredDocuments.id, {
      onDelete: "set null",
    }),
    status: text("status").$type<ApplicationStatus>().notNull().default("queued"),
    appliedAt: timestamp("applied_at", { mode: "date" }),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("applications_user_idx").on(t.userId)]
);
