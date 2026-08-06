import assert from 'node:assert/strict';
import test from 'node:test';
import projects from '../src/data/projects.ts';
import {
  filterProjects,
  getAdjacentProjectId,
  getExpandedMarkerOffsets,
  renderProjectDetails,
  resolveSelection,
} from '../src/lib/project-explorer.ts';

test('the project dataset contains 33 complete, unique, publishable records', () => {
  assert.equal(projects.length, 33);
  assert.equal(new Set(projects.map((project) => project.id)).size, 33);

  projects.forEach((project) => {
    assert.ok(project.id);
    assert.ok(project.name);
    assert.ok(project.city);
    assert.ok(project.state);
    assert.ok(project.locationLabel);
    assert.ok(Number.isFinite(project.latitude));
    assert.ok(Number.isFinite(project.longitude));
    assert.ok(['exact', 'city', 'state'].includes(project.locationPrecision));
    assert.ok(project.description.length > 100);
    assert.ok(project.sectors.length > 0);
    assert.ok(project.services.length > 0);
    assert.doesNotMatch(project.description, /internal project|project number|job number|client logo/i);
  });

  assert.equal(projects.filter((project) => project.locationPrecision === 'state').length, 0);
});

test('search and sector/service filters combine against the same collection', () => {
  const craneProjects = filterProjects(projects, { query: 'crane' });
  assert.ok(craneProjects.some((project) => project.id === 'wakefield-memorial-high-school'));
  assert.ok(craneProjects.some((project) => project.id === 'harvard-smith-campus-center-generator'));

  const aldieProjects = filterProjects(projects, { query: 'Aldie' });
  assert.deepEqual(aldieProjects.map((project) => project.id), ['iad-12-13-data-centers']);

  const higherEducationLoading = filterProjects(projects, {
    sector: 'Higher education',
    service: 'Construction loading',
  });
  assert.ok(higherEducationLoading.length > 0);
  assert.ok(higherEducationLoading.every((project) => project.sectors.includes('Higher education')));
  assert.ok(higherEducationLoading.every((project) => project.services.includes('Construction loading')));
});

test('project selection and adjacent navigation resolve deterministically', () => {
  assert.equal(resolveSelection(projects, 'volpe-c3')?.name, 'Volpe C3 Building');
  assert.equal(resolveSelection(projects, 'missing-project'), null);
  assert.equal(getAdjacentProjectId(projects, projects[0].id, 'previous'), null);
  assert.equal(getAdjacentProjectId(projects, projects[0].id, 'next'), projects[1].id);
  assert.equal(getAdjacentProjectId(projects, projects.at(-1)?.id ?? '', 'next'), null);
});

test('detail rendering includes the complete scope, tags, location precision, and controls', () => {
  const project = projects.find((item) => item.id === 'belmont-b4-data-center');
  if (!project) throw new Error('Expected Belmont B4 project fixture');

  const html = renderProjectDetails(project, projects);
  assert.match(html, /Belmont B4 Data Center CE \/ Bluefin Rigging/);
  assert.match(html, /Sterling, VA/);
  assert.match(html, /temporary loading-platform/);
  assert.match(html, /Data centers/);
  assert.match(html, /Rigging and crane operations/);
  assert.match(html, /Verified project location/);
  assert.match(html, /data-detail-previous/);
  assert.match(html, /data-detail-next/);

  const escaped = renderProjectDetails({ ...project, name: '<Unsafe & name>' }, [project]);
  assert.match(escaped, /&lt;Unsafe &amp; name&gt;/);
  assert.doesNotMatch(escaped, /<Unsafe/);
});

test('co-located projects receive unique deterministic screen offsets', () => {
  const offsets = getExpandedMarkerOffsets(projects);
  const airportProjects = projects.filter((project) => project.latitude === 42.3617162 && project.longitude === -71.0203912);
  const airportOffsets = airportProjects.map((project) => offsets.get(project.id));
  const serializedOffsets = airportOffsets.map((offset) => `${offset?.x},${offset?.y}`);

  assert.ok(airportProjects.length > 1);
  assert.equal(new Set(serializedOffsets).size, airportProjects.length);
  assert.deepEqual(getExpandedMarkerOffsets(projects), offsets);
});
