const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../dist/content.js'), 'utf8'), context);
const { editions, projects } = context.window.STROLL_CONTENT;
assert(editions.length > 0, 'Must have an edition');
const dates = new Set();
for (const edition of editions) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(edition.id), 'Edition must have an ISO date');
  assert(!dates.has(edition.id), 'Duplicate edition date');
  dates.add(edition.id);
  assert(edition.projects.length === 6, 'Trial edition must contain six projects');
  assert(new Set(edition.projects).size === edition.projects.length, 'Duplicate recommendation');
  for (const id of edition.projects) {
    const project = projects[id];
    assert(project, `Missing project ${id}`);
    for (const key of ['name', 'repo', 'category', 'title', 'description', 'note', 'art', 'color']) assert(typeof project[key] === 'string' && project[key].trim(), `Invalid ${id}.${key}`);
    assert(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(project.repo), 'Invalid repository');
    assert(Array.isArray(project.tags) && project.tags.length <= 3 && project.tags.length > 0, 'Keep tags concise');
    assert(['send', 'text', 'capture', 'image', 'vector', 'files'].includes(project.art), 'Missing original illustration');
  }
}
console.log(`Content OK: ${editions.length} real edition, ${Object.keys(projects).length} unique projects; all recommendations have sources and usage notes.`);
