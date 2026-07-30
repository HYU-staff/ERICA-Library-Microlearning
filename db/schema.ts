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
