// ── Atlas tab ────────────────────────────────────────────────
// Team topology map, customer-need matrix, and product-deliverable format
// validator/uploader. Uses the same NieR console shell as the other tabs.

import {
  TEAM_TOPOLOGY, CUSTOMER_NEEDS, FORMAT_SCHEMA,
} from './data.js';
import { setAtlasTeams } from './state.js';
import { shell, screenTitle, icon } from './console.js';
import { escHtml } from './utils.js';
import { showToast } from './utils.js';

const TOPOLOGY_LABEL = {
  'stream-aligned': 'Stream-aligned',
  'platform': 'Platform',
  'enabling': 'Enabling',
  'complicated-subsystem': 'Complicated subsystem',
};

const TOPOLOGY_COLOR = {
  'stream-aligned': '#f59e0b',
  'platform': '#2aa8ff',
  'enabling': '#34d399',
  'complicated-subsystem': '#b08cff',
};

const MODE_LABEL = {
  'collaboration': 'Collaboration',
  'x-as-a-service': 'X-as-a-Service',
  'facilitating': 'Facilitating',
};

/** Resolve the active topology, falling back to the shipped sample. */
function getTeams(s) {
  return s.atlas?.teams?.length ? s.atlas.teams : TEAM_TOPOLOGY;
}

/** Build a lookup map for teams by id. */
function teamMap(teams) {
  return Object.fromEntries(teams.map(t => [t.id, t]));
}

/** Render the full Atlas tab inside the console shell. */
export function renderAtlas(s) {
  const view = s.ui.atlasView || 'map';
  const teams = getTeams(s);
  const needs = CUSTOMER_NEEDS;

  const tabs = [
    { id: 'map', label: 'Topology map', icon: 'sitemap' },
    { id: 'matrix', label: 'Customer-needs matrix', icon: 'grid' },
    { id: 'upload', label: 'Upload format', icon: 'upload' },
  ].map(t => `
    <button type="button" class="catlas__tab ${view === t.id ? 'is-active' : ''}"
      data-atlas-view="${t.id}" aria-pressed="${view === t.id}">
      <span class="catlas__tab-icon">${icon(t.icon, 16)}</span>
      <span class="catlas__tab-label">${escHtml(t.label)}</span>
    </button>`).join('');

  let body = `
    ${screenTitle('Atlas', 'Team topology & product operating model')}
    <p class="clead catlas__lead">Map teams to value streams, see how customer needs are covered,
    and upload your own product-deliverable format to replace the sample topology.</p>
    <div class="catlas__tabs" role="tablist" aria-label="Atlas views">${tabs}</div>
    <div class="catlas__stage">`;

  if (view === 'map') body += renderMap(teams);
  else if (view === 'matrix') body += renderMatrix(teams, needs);
  else body += renderUpload(s);

  body += '</div>';

  return shell('atlas', body, 'Explore team topology, needs coverage, and upload your own format.',
    [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Map view ─────────────────────────────────────────────────

function renderMap(teams) {
  const byId = teamMap(teams);
  const lanes = groupByTopology(teams);
  const laneOrder = ['stream-aligned', 'platform', 'complicated-subsystem', 'enabling'];

  const maxLane = Math.max(...laneOrder.map(k => lanes[k]?.length || 0), 1);
  const svg = renderEdgesSvg(teams, byId, maxLane);

  const lanesHtml = laneOrder.map(topo => {
    const items = (lanes[topo] || []).map((t, i) => renderTeamCard(t, i, byId)).join('');
    return `
      <div class="catlas__lane catlas__lane--${topo.replace(/\s+/g, '-')}" data-topology="${topo}">
        <h4 class="catlas__lane-h">
          ${escHtml(TOPOLOGY_LABEL[topo])}
        </h4>
        <div class="catlas__lane-items">${items || '<span class="catlas__empty">No team</span>'}</div>
      </div>`;
  }).join('');

  return `
    <div class="catlas__map">
      ${svg}
      <div class="catlas__lanes">${lanesHtml}</div>
    </div>
    <p class="catlas__hint">Hover or focus a team to trace its connections.</p>
    <div class="catlas__legend">
      ${Object.entries(MODE_LABEL).map(([mode, label]) => `
        <span class="catlas__legend-item catlas__legend-item--${mode}">
          <span class="catlas__legend-dot"></span>${escHtml(label)}
        </span>`).join('')}
    </div>`;
}

function groupByTopology(teams) {
  return teams.reduce((acc, t) => {
    acc[t.topology] = acc[t.topology] || [];
    acc[t.topology].push(t);
    return acc;
  }, {});
}

function renderTeamCard(t, i, byId = {}) {
  const needs = (t.needs || []).slice(0, 3).map(n => {
    const need = CUSTOMER_NEEDS.find(x => x.id === n);
    return `<span class="ctag ctag--sm">${escHtml(need?.label || n)}</span>`;
  }).join('');
  const links = (t.edges || []).map(e => {
    const target = byId[e.to]?.name || e.to;
    return `<li class="catlas__link"><span class="catlas__link-dot catlas__link-dot--${e.mode}" aria-hidden="true"></span>${escHtml(MODE_LABEL[e.mode] || e.mode)} → ${escHtml(target)}</li>`;
  }).join('');
  return `
    <article class="catlas__card" data-team="${t.id}" data-topology="${t.topology}"
      tabindex="0" aria-label="${escHtml(t.name)}, ${escHtml(TOPOLOGY_LABEL[t.topology] || t.topology)}${t.edges?.length ? `, ${t.edges.length} cross-team link${t.edges.length > 1 ? 's' : ''}` : ''}">
      <header class="catlas__card-head">
        <span class="catlas__card-dot" aria-hidden="true"></span>
        <h5 class="catlas__card-title">${escHtml(t.name)}</h5>
      </header>
      <div class="catlas__card-needs">${needs || '<span class="catlas__muted">No needs listed</span>'}</div>
      ${t.edges?.length ? `
        <ul class="catlas__card-links">${links}</ul>` : ''}
    </article>`;
}

function connectedTeamIds(team) {
  const ids = new Set([team.id]);
  (team.edges || []).forEach(e => ids.add(e.to));
  return ids;
}

function renderEdgesSvg(teams, byId, maxLane) {
  // We render edges as an SVG overlay. Because the layout is a CSS grid of
  // lanes with cards, exact edge routing is expensive to keep synced on resize.
  // Instead we draw a lightweight schematic: cards placed in a logical grid and
  // edges as curved paths between lane columns. CSS positions the SVG behind.
  const rows = Math.max(maxLane, 1);
  const w = 4; // logical columns: stream-aligned, platform, comp-sub, enabling
  const h = rows;
  // Build a logical grid placement for each team so edges can reference it.
  const lanes = groupByTopology(teams);
  const laneOrder = ['stream-aligned', 'platform', 'complicated-subsystem', 'enabling'];
  const pos = {};
  laneOrder.forEach((topo, col) => {
    (lanes[topo] || []).forEach((t, row) => { pos[t.id] = { col, row }; });
  });

  const paths = [];
  teams.forEach(t => {
    const p = pos[t.id];
    if (!p) return;
    (t.edges || []).forEach(e => {
      const q = pos[e.to];
      if (!q) return;
      paths.push(`<path class="catlas__edge catlas__edge--${e.mode}"
        data-from="${t.id}" data-to="${e.to}"
        d="M ${p.col + 0.5} ${p.row + 0.5} C ${p.col + 0.9} ${p.row + 0.5}, ${q.col + 0.1} ${q.row + 0.5}, ${q.col + 0.5} ${q.row + 0.5}"/>`);
    });
  });

  return `
    <svg class="catlas__edges" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"
      aria-hidden="true">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3"
          orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 L0,0" fill="currentColor"/>
        </marker>
      </defs>
      ${paths.join('')}
    </svg>`;
}

// ── Matrix view ──────────────────────────────────────────────

function renderMatrix(teams, needs) {
  const needIds = needs.map(n => n.id);
  const headerCells = needs.map(n => `
    <th class="catlas__th" scope="col"><span class="catlas__th-inner">${escHtml(n.label)}</span></th>`).join('');

  const rows = teams.map(t => {
    const cells = needIds.map(nid => {
      const on = (t.needs || []).includes(nid);
      return `<td class="catlas__cell ${on ? 'is-covered' : 'is-uncovered'}">
        <span class="catlas__cell-mark" aria-label="${on ? 'Covered' : 'Not covered'}"></span>
      </td>`;
    }).join('');
    return `
      <tr class="catlas__tr">
        <th class="catlas__row-h" scope="row">
          <span class="catlas__row-dot" data-topology="${t.topology}"></span>
          ${escHtml(t.name)}
        </th>
        ${cells}
      </tr>`;
  }).join('');

  return `
    <div class="catlas__matrix-wrap">
      <table class="catlas__matrix">
        <thead>
          <tr>
            <th class="catlas__th catlas__th--corner" scope="col">Team / Need</th>
            ${headerCells}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="catlas__matrix-note">A covered need means the team owns that outcome directly.
    Gaps show where no team is aligned to a need yet.</p>`;
}

// ── Upload / validator view ──────────────────────────────────

function renderUpload(s) {
  const isCustom = !!(s.atlas?.teams?.length);
  return `
    <div class="catlas__upload">
      <section class="cpanel catlas__dropzone" id="atlasDropzone">
        <div class="catlas__dropzone-inner">
          <span class="catlas__upload-icon">${icon('upload', 36)}</span>
          <h4 class="catlas__panel-h">Upload product-deliverable format</h4>
          <p class="clead">Drop a JSON file here or click to browse. The validator checks
          team topology, customer needs, and cross-team interaction modes.</p>
          <input type="file" id="atlasFile" class="catlas__file" accept="application/json,.json"
            aria-label="Upload team topology JSON">
          <button type="button" class="btn btn--primary btn--sm" id="atlasPickFile">Choose file</button>
        </div>
        <div class="catlas__result" id="atlasResult" aria-live="polite"></div>
      </section>
      <section class="cpanel">
        <h4 class="catlas__panel-h">Expected format</h4>
        <p class="clead">The JSON must contain a <code>teams</code> array. Each team has
        an <code>id</code>, <code>name</code>, <code>topology</code>, <code>needs</code>
        array, and <code>edges</code> array describing how it interacts with other teams.</p>
        <pre class="catlas__schema"><code>${escHtml(JSON.stringify(FORMAT_SCHEMA, null, 2))}</code></pre>
        <div class="catlas__actions">
          <button type="button" class="btn btn--ghost btn--sm" id="atlasDownloadExample">Download example</button>
          ${isCustom ? `<button type="button" class="btn btn--ghost btn--sm" id="atlasResetSample">Use sample topology</button>` : ''}
        </div>
      </section>
    </div>`;
}

// ── Validation logic ─────────────────────────────────────────

export function validateAtlasJson(json) {
  const errors = [];
  if (!json || typeof json !== 'object') {
    errors.push('Upload must be a JSON object.');
    return { ok: false, errors };
  }
  if (!Array.isArray(json.teams)) {
    errors.push('Missing or invalid "teams" array.');
    return { ok: false, errors };
  }
  if (json.teams.length === 0) {
    errors.push('"teams" array must contain at least one team.');
  }

  const validTopologies = FORMAT_SCHEMA.enums['teams[].topology'];
  const validModes = FORMAT_SCHEMA.enums['teams[].edges[].mode'];
  const ids = new Set();

  json.teams.forEach((t, i) => {
    const prefix = `teams[${i}]`;
    if (!t || typeof t !== 'object') { errors.push(`${prefix} is not an object.`); return; }
    if (typeof t.id !== 'string' || !t.id.trim()) errors.push(`${prefix}.id is required.`);
    else if (ids.has(t.id)) errors.push(`${prefix}.id "${t.id}" is duplicated.`);
    else ids.add(t.id);
    if (typeof t.name !== 'string' || !t.name.trim()) errors.push(`${prefix}.name is required.`);
    if (!validTopologies.includes(t.topology)) errors.push(`${prefix}.topology must be one of ${validTopologies.join(', ')}.`);
    if (!Array.isArray(t.needs)) errors.push(`${prefix}.needs must be an array.`);
    if (!Array.isArray(t.edges)) errors.push(`${prefix}.edges must be an array.`);

    (t.edges || []).forEach((e, j) => {
      const epre = `${prefix}.edges[${j}]`;
      if (!e || typeof e !== 'object') { errors.push(`${epre} is not an object.`); return; }
      if (typeof e.to !== 'string' || !e.to.trim()) errors.push(`${epre}.to is required.`);
      else if (!ids.has(e.to) && !json.teams.some(x => x.id === e.to)) errors.push(`${epre}.to "${e.to}" points to a team not defined above it.`);
      if (!validModes.includes(e.mode)) errors.push(`${epre}.mode must be one of ${validModes.join(', ')}.`);
      if (typeof e.label !== 'string' || !e.label.trim()) errors.push(`${epre}.label is required.`);
    });
  });

  // Check that every edge target across the whole file resolves to a defined team.
  const allIds = new Set(json.teams.map(t => t.id));
  json.teams.forEach((t, i) => {
    (t.edges || []).forEach((e, j) => {
      if (e.to && !allIds.has(e.to)) {
        errors.push(`teams[${i}].edges[${j}].to "${e.to}" points to an undefined team.`);
      }
    });
  });

  return { ok: errors.length === 0, errors, teams: json.teams };
}

// ── Event binding helpers ────────────────────────────────────

export function bindAtlasEvents(s, container) {
  const map = container?.querySelector('.catlas__map');
  if (map) {
    const highlight = (teamId) => {
      const teams = getTeams(s);
      const team = teams.find(t => t.id === teamId);
      const connected = team ? connectedTeamIds(team) : new Set([teamId]);
      map.dataset.highlightTeam = teamId;
      map.querySelectorAll('.catlas__card').forEach(c => {
        c.classList.toggle('is-dimmed', !connected.has(c.dataset.team));
      });
      map.querySelectorAll('.catlas__edge').forEach(edge => {
        const active = edge.dataset.from === teamId || edge.dataset.to === teamId;
        edge.classList.toggle('is-dimmed', !active);
        edge.classList.toggle('is-focused', active);
      });
    };
    const clear = () => {
      delete map.dataset.highlightTeam;
      map.querySelectorAll('.catlas__card').forEach(c => c.classList.remove('is-dimmed'));
      map.querySelectorAll('.catlas__edge').forEach(e => e.classList.remove('is-dimmed', 'is-focused'));
    };
    // Mouse and keyboard both trace a team's links; focusin/out makes the
    // reveal reachable without a pointer. Tap on touch focuses the card, which
    // fires focusin, so touch is covered too.
    map.addEventListener('mouseenter', (e) => {
      const card = e.target.closest('.catlas__card');
      if (card) highlight(card.dataset.team);
    }, true);
    map.addEventListener('mouseleave', clear, true);
    map.addEventListener('focusin', (e) => {
      const card = e.target.closest('.catlas__card');
      if (card) highlight(card.dataset.team);
    });
    map.addEventListener('focusout', (e) => {
      if (!map.contains(e.relatedTarget)) clear();
    });
  }

  container?.addEventListener('click', (e) => {
    const pick = e.target.closest('#atlasPickFile');
    if (pick) { container.querySelector('#atlasFile')?.click(); return true; }

    const download = e.target.closest('#atlasDownloadExample');
    if (download) { downloadExample(); return true; }
  });

  // Use event delegation for the file input because it is recreated on every
  // render of the Upload view; a listener attached to a specific element would
  // be lost as soon as the view switches.
  container?.addEventListener('change', (e) => {
    const fileInput = e.target.closest('#atlasFile');
    if (!fileInput) return;
    const file = fileInput.files?.[0];
    if (file) handleFile(s, file, container);
  });

  const dropzone = container?.querySelector('#atlasDropzone');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropzone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
      });
    });
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(s, file, container);
    });
  }
}

function handleFile(s, file, container) {
  const resultBox = container?.querySelector('#atlasResult');
  if (!resultBox) return;
  resultBox.innerHTML = '<p class="catlas__result-msg catlas__result-msg--info">Reading file…</p>';

  const reader = new FileReader();
  reader.onload = () => {
    let json;
    try {
      json = JSON.parse(reader.result);
    } catch (err) {
      showResult(resultBox, false, [`Invalid JSON: ${err?.message || 'parse error'}`]);
      return;
    }
    const validation = validateAtlasJson(json);
    if (validation.ok) {
      setAtlasTeams(s, validation.teams);
      showResult(resultBox, true, ['Upload valid. Your topology is now live in Atlas.']);
    } else {
      showResult(resultBox, false, validation.errors);
    }
  };
  reader.onerror = () => {
    showResult(resultBox, false, ['Could not read the file. Try again.']);
  };
  reader.readAsText(file);
}

function showResult(box, ok, messages) {
  const list = messages.map(m => `<li>${escHtml(m)}</li>`).join('');
  box.innerHTML = `
    <div class="catlas__result-box ${ok ? 'is-success' : 'is-error'}">
      <strong>${ok ? '✓ Valid' : '✗ Validation failed'}</strong>
      <ul>${list}</ul>
    </div>`;
}

function downloadExample() {
  const example = {
    teams: [
      { id: 'stream-payments', name: 'Payments Experience', topology: 'stream-aligned',
        needs: ['checkout', 'payments'],
        edges: [
          { to: 'platform-payments', mode: 'x-as-a-service', label: 'payments API' },
          { to: 'security-governance', mode: 'facilitating', label: 'compliance review' },
        ] },
      { id: 'platform-payments', name: 'Payments Platform', topology: 'platform',
        needs: ['transaction integrity', 'compliance'],
        edges: [] },
      { id: 'security-governance', name: 'Security & Governance', topology: 'enabling',
        needs: ['risk reduction', 'compliance'],
        edges: [] },
    ],
  };
  const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'questline-atlas-example.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Example downloaded');
}
