import type { Project } from '../data/projects';

export type ProjectFilters = {
  query?: string;
  sector?: string;
  service?: string;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase('en-US');

export function filterProjects(projects: Project[], filters: ProjectFilters = {}): Project[] {
  const query = normalize(filters.query ?? '');

  return projects.filter((project) => {
    const searchableText = normalize([
      project.name,
      project.city,
      project.state,
      project.locationLabel,
      project.description,
      ...project.sectors,
      ...project.services,
    ].join(' '));

    const matchesQuery = !query || searchableText.includes(query);
    const matchesSector = !filters.sector || project.sectors.includes(filters.sector);
    const matchesService = !filters.service || project.services.includes(filters.service);

    return matchesQuery && matchesSector && matchesService;
  });
}

export function resolveSelection(projects: Project[], projectId: string | null): Project | null {
  if (!projectId) return null;
  return projects.find((project) => project.id === projectId) ?? null;
}

export function getAdjacentProjectId(
  projects: Project[],
  projectId: string,
  direction: 'previous' | 'next',
): string | null {
  const index = projects.findIndex((project) => project.id === projectId);
  if (index === -1) return null;

  const adjacentIndex = direction === 'previous' ? index - 1 : index + 1;
  return projects[adjacentIndex]?.id ?? null;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  })[character] ?? character);
}

export function renderProjectDetails(project: Project, visibleProjects: Project[]): string {
  const projectNumber = visibleProjects.findIndex((item) => item.id === project.id) + 1;
  const previousId = getAdjacentProjectId(visibleProjects, project.id, 'previous');
  const nextId = getAdjacentProjectId(visibleProjects, project.id, 'next');
  const precisionLabel = project.locationPrecision === 'exact'
    ? 'Verified project location'
    : project.locationPrecision === 'city'
      ? 'Marker shown at city center'
      : 'Approximate statewide marker';

  const renderTags = (label: string, tags: string[]) => `
    <div class="project-detail-tag-group">
      <span>${escapeHtml(label)}</span>
      <ul>${tags.map((tag) => `<li>${escapeHtml(tag)}</li>`).join('')}</ul>
    </div>`;

  return `
    <div class="project-detail-index">Project ${String(projectNumber).padStart(2, '0')} of ${String(visibleProjects.length).padStart(2, '0')}</div>
    <p class="project-detail-location">${escapeHtml(project.locationLabel)}</p>
    <h2 id="project-detail-title">${escapeHtml(project.name)}</h2>
    <p class="project-detail-precision">${escapeHtml(precisionLabel)}</p>
    <p class="project-detail-description">${escapeHtml(project.description)}</p>
    <div class="project-detail-tags">
      ${renderTags('Sector', project.sectors)}
      ${renderTags('Engineering services', project.services)}
    </div>
    <div class="project-detail-navigation" aria-label="Project navigation">
      <button type="button" data-detail-previous ${previousId ? `data-project-id="${escapeHtml(previousId)}"` : 'disabled'}>
        <span aria-hidden="true">←</span> Previous
      </button>
      <button type="button" data-detail-next ${nextId ? `data-project-id="${escapeHtml(nextId)}"` : 'disabled'}>
        Next <span aria-hidden="true">→</span>
      </button>
    </div>`;
}

export type MarkerOffset = { x: number; y: number };

export function getExpandedMarkerOffsets(projects: Project[]): Map<string, MarkerOffset> {
  const groups = new Map<string, Project[]>();
  const offsets = new Map<string, MarkerOffset>();

  projects.forEach((project) => {
    const key = `${project.latitude.toFixed(6)},${project.longitude.toFixed(6)}`;
    groups.set(key, [...(groups.get(key) ?? []), project]);
  });

  groups.forEach((group) => {
    const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
    if (ordered.length === 1) {
      offsets.set(ordered[0].id, { x: 0, y: 0 });
      return;
    }

    ordered.forEach((project, index) => {
      const firstRingCapacity = 7;
      const ring = index < firstRingCapacity ? 0 : 1;
      const position = ring === 0 ? index : index - firstRingCapacity;
      const ringCount = ring === 0 ? Math.min(ordered.length, firstRingCapacity) : ordered.length - firstRingCapacity;
      const radius = ring === 0 ? 27 : 46;
      const angle = (-Math.PI / 2) + (position / ringCount) * Math.PI * 2 + (ring * 0.18);

      offsets.set(project.id, {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
      });
    });
  });

  return offsets;
}
