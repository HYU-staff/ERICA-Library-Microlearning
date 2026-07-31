import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const analyticsUsers = sqliteTable("analytics_users", {
  email: text("email").primaryKey(),
  name: text("name"),
  firstSeen: text("first_seen").notNull(),
  lastSeen: text("last_seen").notNull(),
  accessCount: integer("access_count").notNull().default(0),
});

export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  eventType: text("event_type").notNull(),
  videoTitle: text("video_title"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("analytics_events_email_idx").on(table.email),
  index("analytics_events_type_idx").on(table.eventType),
  index("analytics_events_created_idx").on(table.createdAt),
]);

export const siteAdmins = sqliteTable("site_admins", {
  email: text("email").primaryKey(),
  createdAt: text("created_at").notNull(),
});

export const contentVideos = sqliteTable("content_videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  minutes: integer("minutes").notNull(),
  mediaKey: text("media_key").notNull().unique(),
  audiences: text("audiences").notNull(),
  levels: text("levels").notNull(),
  topics: text("topics").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
}, (table) => [
  index("content_videos_created_idx").on(table.createdAt),
]);
