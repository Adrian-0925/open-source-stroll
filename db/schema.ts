import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {id:text('id').primaryKey(),payload:text('payload').notNull()});
export const editions = sqliteTable('editions', {id:text('id').primaryKey(),payload:text('payload').notNull()});
export const state = sqliteTable('state', {key:text('key').primaryKey(),value:text('value').notNull()});
