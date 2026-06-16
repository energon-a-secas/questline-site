// ── Playbooks tab ────────────────────────────────────────────
// Editable onboarding workflows, authored as ordered step lists in the spirit
// of the skill tree. A master list of playbooks on the left; the selected one
// reads as a numbered sequence on the right. A read/edit toggle turns the
// detail into an inline editor (rename, reorder, add/remove steps). All edits
// persist to localStorage via state.js.

import { state } from './state.js';
import { escHtml } from './utils.js';
import { icon, screenTitle, shell } from './console.js';

export function renderPlaybooks(s, selectedId) {
  const list = s.playbooks;
  const sel = list.find(p => p.id === selectedId) || list.find(p => p.id === s.ui.playbookSel) || list[0] || null;
  s.ui.playbookSel = sel?.id || null;
  s.ui.rowCursor = sel ? list.findIndex(p => p.id === sel.id) : 0;

  const rows = list.map((p, i) => playbookRow(p, i, s)).join('');
  const detail = sel ? playbookDetail(s, sel) : playbookEmpty();

  const body = `
    ${screenTitle('Playbooks', 'Workflows')}
    <div class="cmaster">
      <div class="cpanel clist" role="listbox" aria-label="Playbooks">
        <div class="clist__head clist__head--row">
          <span>Workflows</span>
          <button type="button" class="clist__add" id="addPlaybook" aria-label="Add a playbook">
            ${icon('plus', 14)}</button>
        </div>
        <div class="clist__rows">${rows || '<p class="clist__empty">No playbooks yet.</p>'}</div>
      </div>
      <div class="cpanel cdetail cplaybook" id="playbookDetail">${detail}</div>
    </div>`;
  return shell('playbooks', body, 'Open a workflow to follow it, or edit to write your own steps.',
    [{ k: '↑↓', v: 'Select' }, { k: '↵', v: 'Open' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

function playbookRow(p, i, s) {
  const active = p.id === s.ui.playbookSel;
  const cursored = s.ui.region === 'list' && i === s.ui.rowCursor;
  const done = p.steps.filter(st => st.title && st.title !== 'New step').length;
  const total = p.steps.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `
    <button type="button" class="crow crow--pb ${active ? 'crow--active' : ''} ${cursored ? 'is-cursor' : ''}"
      data-playbook="${p.id}" role="option" aria-selected="${active}"
      tabindex="${cursored ? '-1' : '0'}">
      <span class="crow__pbicon">${icon(p.icon || 'route', 18)}</span>
      <span class="crow__col">
        <span class="crow__name">${escHtml(p.title)}</span>
        <span class="crow__pbbar"><span style="--pct:${pct / 100}"></span></span>
      </span>
      <span class="crow__pbbadge">${total}</span>
    </button>`;
}

function playbookEmpty() {
  return `
    <div class="cdetail__locked">
      <span class="cdetail__lockicon">${icon('route', 30)}</span>
      <h3>No playbook selected</h3>
      <p>Add a workflow with the + button, then write its steps. Each step is short — link out to the wiki for the full detail.</p>
    </div>`;
}

function playbookDetail(s, pb) {
  return s.ui.playbookEdit ? playbookEditor(s, pb) : playbookReader(s, pb);
}

// ── Read mode ──────────────────────────────────────────────

function playbookReader(s, pb) {
  const meta = [
    pb.category ? `<span class="cplaybook__tag">${escHtml(pb.category)}</span>` : null,
    pb.estMinutes ? `<span>~${pb.estMinutes} min</span>` : null,
    `<span>${pb.steps.length} steps</span>`,
  ].filter(Boolean).join('');

  const steps = pb.steps.length
    ? pb.steps.map((st, i) => `
        <li class="cstep">
          <span class="cstep__node" aria-hidden="true"><span>${String(i + 1).padStart(2, '0')}</span></span>
          <div class="cstep__main">
            <div class="cstep__title">${escHtml(st.title)}</div>
            ${st.body ? `<p class="cstep__body">${escHtml(st.body)}</p>` : ''}
            ${st.link ? `<a class="cstep__link" href="${escHtml(st.link.url)}" target="_blank" rel="noopener noreferrer">
              ${icon('external', 13)} ${escHtml(st.link.label || 'Read more')}</a>` : ''}
          </div>
        </li>`).join('')
    : '<li class="cstep cstep--empty">No steps yet. Switch to edit to add some.</li>';

  return `
    <div class="cdetail__head cplaybook__head">
      <span class="cplaybook__icon">${icon(pb.icon || 'route', 26)}</span>
      <div class="cdetail__heading">
        <h3 class="cdetail__title">${escHtml(pb.title)}</h3>
        ${pb.summary ? `<p class="cdetail__summary">${escHtml(pb.summary)}</p>` : ''}
        <span class="cplaybook__meta">${meta}</span>
      </div>
      <button type="button" class="cdone" id="editPlaybook" aria-label="Edit this playbook">
        <span class="cdone__txt">${icon('pencil', 13)} Edit</span>
      </button>
    </div>
    <ol class="csteps">${steps}</ol>`;
}

// ── Edit mode ──────────────────────────────────────────────

function playbookEditor(s, pb) {
  const steps = pb.steps.map((st, i) => stepEditor(s, pb, st, i)).join('');
  return `
    <div class="cdetail__head cplaybook__head">
      <span class="cplaybook__icon">${icon(pb.icon || 'route', 26)}</span>
      <div class="cdetail__heading">
        <h3 class="cdetail__title">${escHtml(pb.title)}</h3>
        <span class="cplaybook__meta">Editing workflow</span>
      </div>
      <button type="button" class="cseal" id="donePlaybook" aria-label="Done editing">
        <span class="cseal__mark">${icon('check', 13)} Done</span>
      </button>
    </div>
    <form class="cpbform" data-pb-form="${pb.id}">
      <div class="cpbform__grid">
        <label class="ccredform__field ccredform__field--wide">
          <span>Title</span>
          <input type="text" name="title" value="${escHtml(pb.title)}" autocomplete="off">
        </label>
        <label class="ccredform__field">
          <span>Category</span>
          <input type="text" name="category" value="${escHtml(pb.category || '')}" autocomplete="off">
        </label>
        <label class="ccredform__field">
          <span>Est. minutes</span>
          <input type="number" name="estMinutes" value="${pb.estMinutes ?? ''}" min="0" autocomplete="off">
        </label>
        <label class="ccredform__field ccredform__field--wide">
          <span>Summary</span>
          <input type="text" name="summary" value="${escHtml(pb.summary || '')}" autocomplete="off">
        </label>
      </div>
    </form>
    <div class="cpbsteps">${steps || '<p class="clist__empty">No steps yet.</p>'}</div>
    <div class="cpbedit__actions">
      <button type="button" class="clink-danger" id="deletePlaybook">Delete playbook</button>
      <div class="ccredform__btns">
        <button type="button" class="btn btn--ghost btn--sm" id="addStep">${icon('plus', 13)} Add step</button>
      </div>
    </div>`;
}

function stepEditor(s, pb, st, i) {
  const open = s.ui.stepEditing === st.id;
  if (open) {
    return `
      <form class="cstepform" data-step-form="${st.id}" data-pb="${pb.id}">
        <div class="cpbform__grid">
          <label class="ccredform__field ccredform__field--wide">
            <span>Step title</span>
            <input type="text" name="title" value="${escHtml(st.title)}" autocomplete="off">
          </label>
          <label class="ccredform__field ccredform__field--wide">
            <span>Body</span>
            <textarea name="body" rows="3" autocomplete="off">${escHtml(st.body || '')}</textarea>
          </label>
          <label class="ccredform__field">
            <span>Link label</span>
            <input type="text" name="linkLabel" value="${escHtml(st.link?.label || '')}" autocomplete="off">
          </label>
          <label class="ccredform__field">
            <span>Link URL</span>
            <input type="url" name="linkUrl" value="${escHtml(st.link?.url || '')}" placeholder="https://" autocomplete="off">
          </label>
        </div>
        <div class="ccredform__actions">
          <button type="button" class="clink-danger" data-step-delete="${st.id}">Remove step</button>
          <div class="ccredform__btns">
            <button type="button" class="btn btn--ghost btn--sm" data-step-cancel="${st.id}">Cancel</button>
            <button type="submit" class="btn btn--primary btn--sm">Save step</button>
          </div>
        </div>
      </form>`;
  }
  const last = i === pb.steps.length - 1;
  return `
    <div class="cpbstep">
      <span class="cpbstep__no">${String(i + 1).padStart(2, '0')}</span>
      <div class="cpbstep__text">
        <span class="cpbstep__title">${escHtml(st.title)}</span>
        ${st.body ? `<span class="cpbstep__body">${escHtml(st.body)}</span>` : ''}
      </div>
      <div class="cpbstep__ctl">
        <button type="button" class="cpbstep__btn" data-step-move="${st.id}" data-dir="-1"
          ${i === 0 ? 'disabled' : ''} aria-label="Move step up">${icon('caret-up', 14)}</button>
        <button type="button" class="cpbstep__btn" data-step-move="${st.id}" data-dir="1"
          ${last ? 'disabled' : ''} aria-label="Move step down">${icon('caret-down', 14)}</button>
        <button type="button" class="cpbstep__btn cpbstep__btn--edit" data-step-edit="${st.id}" aria-label="Edit step">${icon('pencil', 14)}</button>
      </div>
    </div>`;
}
