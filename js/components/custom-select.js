// js/components/custom-select.js — Custom dropdown conforme au design system Marcassin

export function initCustomSelects(container = document) {
  container.querySelectorAll('select[data-custom]').forEach(select => {
    if (select.dataset.customized) return;
    select.dataset.customized = 'true';
    createCustomSelect(select);
  });
}

function createCustomSelect(originalSelect) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cs-wrapper';

  // Copy sizing from original select
  const computedStyle = originalSelect.style;
  if (computedStyle.minWidth) wrapper.style.minWidth = computedStyle.minWidth;
  if (computedStyle.flex) wrapper.style.flex = computedStyle.flex;

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cs-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  // Dropdown panel — uses fixed positioning to avoid overflow issues
  const dropdown = document.createElement('div');
  dropdown.className = 'cs-dropdown';
  dropdown.setAttribute('role', 'listbox');

  function buildOptions() {
    dropdown.innerHTML = '';
    for (const child of originalSelect.children) {
      if (child.tagName === 'OPTGROUP') {
        const groupLabel = document.createElement('div');
        groupLabel.className = 'cs-group-label';
        groupLabel.textContent = child.label;
        dropdown.appendChild(groupLabel);
        for (const opt of child.children) {
          dropdown.appendChild(createOption(opt));
        }
      } else if (child.tagName === 'OPTION') {
        dropdown.appendChild(createOption(child));
      }
    }
  }

  function createOption(opt) {
    const item = document.createElement('div');
    item.className = 'cs-option';
    item.dataset.value = opt.value;
    item.setAttribute('role', 'option');
    item.textContent = opt.textContent;
    if (opt.selected) item.classList.add('selected');
    if (opt.disabled) { item.classList.add('disabled'); item.setAttribute('aria-disabled', 'true'); }

    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (opt.disabled) return;
      originalSelect.value = opt.value;
      originalSelect.dispatchEvent(new Event('change', { bubbles: true }));
      updateTrigger();
      close();
    });
    return item;
  }

  function updateTrigger() {
    const selected = originalSelect.options[originalSelect.selectedIndex];
    trigger.innerHTML = `
      <span class="cs-trigger-text">${selected ? selected.textContent : 'Sélectionner...'}</span>
      <svg class="cs-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `;
    dropdown.querySelectorAll('.cs-option').forEach(o => {
      o.classList.toggle('selected', o.dataset.value === originalSelect.value);
    });
  }

  function positionDropdown() {
    const rect = trigger.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';

    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 260) {
      dropdown.style.bottom = (window.innerHeight - rect.top + 4) + 'px';
      dropdown.style.top = 'auto';
    } else {
      dropdown.style.top = (rect.bottom + 4) + 'px';
      dropdown.style.bottom = 'auto';
    }
  }

  function open() {
    positionDropdown();
    dropdown.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('open');
    const sel = dropdown.querySelector('.cs-option.selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function close() {
    dropdown.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('open');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.contains('open') ? close() : open();
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && !dropdown.contains(e.target)) close();
  });

  window.addEventListener('scroll', () => { if (dropdown.classList.contains('open')) positionDropdown(); }, true);
  window.addEventListener('resize', () => { if (dropdown.classList.contains('open')) close(); });

  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropdown.classList.contains('open') ? close() : open(); }
  });

  // Hide original, insert custom
  originalSelect.style.display = 'none';
  originalSelect.parentNode.insertBefore(wrapper, originalSelect);
  wrapper.appendChild(trigger);
  wrapper.appendChild(originalSelect);
  // Dropdown appended to body for fixed positioning
  document.body.appendChild(dropdown);

  buildOptions();
  updateTrigger();

  // Observe changes
  const observer = new MutationObserver(() => { buildOptions(); updateTrigger(); });
  observer.observe(originalSelect, { childList: true, subtree: true, attributes: true });
}
