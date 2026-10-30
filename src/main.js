import './styles.css';
import { customers, initialConversations, rishiMessages, templates, filterConversations, escapeHTML } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const html = escapeHTML;
const list = $('#inboxConversationList');
const thread = $('#inboxThreadPanel');
const modal = $('#inboxCreateBackdrop');
const emptyThread = thread.innerHTML;
const conversations = initialConversations.map((item) => ({ ...item }));
const messages = new Map();
const drafts = new Map();
let filter = 'all';
let selectedId = null;
let selectedCustomer = null;
let composerOpen = false;
let modalReturnFocus = null;
let toastTimer;

for (const conversation of conversations) {
  const subject = conversation.preview.replace(/^You: /, '');
  messages.set(conversation.id, conversation.id === 'conversation-rishi-email'
    ? rishiMessages.map((message) => ({ ...message }))
    : [{ subject, sender: `${conversation.name} to You`, time: conversation.time, body: subject }]);
}

function selectedConversation() {
  return conversations.find((item) => item.id === selectedId);
}

function notify(message) {
  const toast = $('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => { toast.hidden = true; toast.classList.remove('is-visible'); }, 3500);
}

function updateCounts() {
  const unread = conversations.filter((item) => item.unread).length;
  const badge = $('#inboxHeaderUnread');
  badge.textContent = unread;
  badge.setAttribute('aria-label', `${unread} contacts need attention`);
  badge.hidden = unread === 0;
  $('#inboxNavLink')?.setAttribute('aria-label', `All inbox, ${unread} contacts with unread messages`);
}

function renderList() {
  const visible = filterConversations(conversations, filter, $('#inboxSearch').value);
  list.innerHTML = visible.length ? visible.map((item) => `
    <button class="inbox-conversation${item.unread ? ' is-unread' : ''}${item.id === selectedId ? ' is-active' : ''}"
      type="button" data-inbox-conversation="${html(item.id)}" data-inbox-unread="${Number(item.unread)}"
      ${item.id === selectedId ? 'aria-current="true"' : ''}>
      <span class="inbox-avatar avatar-email">${html(item.initials)}</span>
      <span class="inbox-conversation-copy"><strong>${html(item.name)}</strong><span>${html(item.preview)}</span></span>
      <span class="inbox-conversation-meta"><span class="inbox-conversation-time">${html(item.time)}</span>
      ${item.unread ? '<span class="inbox-unread-dot" aria-label="1 unread">1</span>' : ''}</span>
    </button>`).join('') : '<div class="inbox-list-empty" role="status">No conversations found.</div>';
  updateCounts();
}

function saveDraft() {
  if (!selectedId || !$('#inboxEmailSubject')) return;
  const previous = drafts.get(selectedId) || {};
  drafts.set(selectedId, { ...previous, subject: $('#inboxEmailSubject').value, body: $('#inboxEmailBody').value });
}

function composerMarkup(person) {
  return `<section class="inbox-email-compose" aria-labelledby="inboxEmailComposeTitle">
    <div class="inbox-email-compose-head"><h3 id="inboxEmailComposeTitle">New message</h3>
      <button class="shell-icon inbox-thread-more" type="button" data-inbox-collapse aria-label="Close composer">${icon('x')}</button></div>
    <label class="inbox-email-field"><span>From</span><input value="Rishi Charan · Paryatech Travel" readonly aria-label="From"></label>
    <label class="inbox-email-field"><span>To</span><input value="${html(person.name)}" readonly aria-label="To"></label>
    <label class="inbox-email-field"><span>Subject</span><input id="inboxEmailSubject" type="text" placeholder="Add a subject"></label>
    <textarea id="inboxEmailBody" aria-label="Email message" placeholder="Write your message…"></textarea>
    <div class="inbox-email-toolbar"><div>
      <button class="button button-primary" type="button" data-inbox-send="email" disabled>Send</button>
      <label class="button button-secondary" aria-label="Attach a file">${icon('upload')}<input class="sr-only" id="inboxAttachmentInput" type="file"></label>
      <div class="customer-mail-template-anchor"><button class="button button-secondary" data-inbox-template-button type="button" aria-haspopup="menu" aria-expanded="false">${icon('message')}Template</button>
        <div class="customer-mail-template-menu" data-inbox-template-menu role="menu" hidden>
          <button type="button" role="menuitem" data-inbox-template="documents"><strong>Request documents</strong><small>Ask for missing travel files</small></button>
          <button type="button" role="menuitem" data-inbox-template="acceptance"><strong>Request acceptance</strong><small>Ask the customer to approve a proposal</small></button>
          <button type="button" role="menuitem" data-inbox-template="letter"><strong>Request supporting letter</strong><small>Ask for an employer or sponsor letter</small></button>
        </div></div><span class="inbox-email-format" aria-hidden="true">A</span><span id="inboxAttachmentName" aria-live="polite"></span></div>
      <button class="shell-icon inbox-thread-more" type="button" data-inbox-discard aria-label="Discard draft">${icon('trash')}</button>
    </div></section>`;
}

function renderThread() {
  const person = selectedConversation();
  if (!person) { thread.innerHTML = emptyThread; return; }
  const history = messages.get(person.id) || [];
  thread.innerHTML = `<header class="inbox-thread-header">
    <button class="shell-icon inbox-mobile-back" type="button" data-inbox-close aria-label="Back to conversations">${icon('chevron-left')}</button>
    <div class="inbox-thread-person"><span class="inbox-avatar avatar-email">${html(person.initials)}</span>
      <div><h2 tabindex="-1">${html(person.name)}</h2><p>${history.length} ${history.length === 1 ? 'message' : 'messages'} in this conversation</p></div></div>
    <div class="inbox-thread-actions"><span class="inbox-channel-badge is-email">${icon('mail')}Email</span>
      <div class="customer-mail-template-anchor" data-inbox-actions-anchor><button class="shell-icon inbox-thread-more" type="button" data-inbox-actions aria-label="Conversation actions" aria-haspopup="menu" aria-expanded="false" aria-controls="inboxConversationActions">${icon('more')}</button>
        <div class="customer-mail-template-menu" id="inboxConversationActions" data-inbox-actions-menu role="menu" hidden>
          <button type="button" role="menuitem" data-inbox-mark-unread><strong>Mark unread</strong></button>
          <button type="button" role="menuitem" data-inbox-delete><strong>Delete conversation</strong><small>Remove from this local Inbox</small></button></div></div>
      <button class="shell-icon inbox-thread-more" type="button" data-inbox-close aria-label="Close conversation" title="Close conversation">${icon('x')}</button></div>
    </header><div class="inbox-email-scroll"><div class="inbox-email-history">${history.map((message) => `
      <article class="inbox-email-card"><header><div><strong>${html(message.subject)}</strong><span>${html(message.sender)}</span></div><time>${html(message.time)}</time></header>
        <p>${html(message.body)}</p>${message.attachment ? `<div class="inbox-email-attachment">${icon('file')}<span>${html(message.attachment)}</span></div>` : ''}</article>`).join('')}
    </div>${composerOpen ? composerMarkup(person) : `<div class="inbox-email-reply"><button class="button button-secondary" type="button" data-inbox-reply>${icon('message')}Reply</button></div>`}</div>`;
  if (composerOpen) {
    const draft = drafts.get(person.id) || { subject: '', body: '' };
    $('#inboxEmailSubject').value = draft.subject;
    $('#inboxEmailBody').value = draft.body;
    $('#inboxAttachmentName').textContent = draft.attachment || '';
    updateSendButton();
  }
}

function openConversation(id, compose = false) {
  saveDraft();
  selectedId = id;
  composerOpen = compose;
  const person = selectedConversation();
  if (!person) return;
  person.unread = false;
  renderList();
  renderThread();
  if (compose) $('#inboxEmailSubject')?.focus();
  else $('.inbox-thread-person h2')?.focus({ preventScroll: true });
}

function closeConversation() {
  const previous = selectedId;
  saveDraft();
  selectedId = null;
  composerOpen = false;
  renderList();
  renderThread();
  $(`[data-inbox-conversation="${CSS.escape(previous || '')}"]`)?.focus({ preventScroll: true });
}

function updateSendButton() {
  const button = $('[data-inbox-send]');
  if (button) button.disabled = !$('#inboxEmailSubject').value.trim() || !$('#inboxEmailBody').value.trim();
}

function sendDemoMessage() {
  const person = selectedConversation();
  const subject = $('#inboxEmailSubject').value.trim();
  const body = $('#inboxEmailBody').value.trim();
  if (!person || !subject || !body) return;
  const draft = drafts.get(person.id);
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date());
  messages.get(person.id).push({ subject, body, time, sender: `You to ${person.name}`, attachment: draft?.attachment });
  person.preview = `You: ${subject}`;
  person.time = time;
  person.attachment ||= Boolean(draft?.attachment);
  drafts.delete(person.id);
  composerOpen = false;
  renderList();
  renderThread();
  notify('Saved in this demo conversation. No email was sent.');
  $('[data-inbox-reply]')?.focus();
}

function renderCustomers() {
  const term = $('#inboxCustomerSearch').value.trim().toLocaleLowerCase();
  const available = customers.filter((person) => `${person.name} ${person.id} ${person.location} ${person.type}`.toLocaleLowerCase().includes(term));
  $('#inboxCustomerResultCount').textContent = `${available.length} available`;
  $('#inboxCustomerList').innerHTML = available.map((person) => `<button class="inbox-customer-option${selectedCustomer === person.id ? ' is-selected' : ''}" type="button" role="option" aria-selected="${selectedCustomer === person.id}" data-inbox-customer="${html(person.id)}">
    <span class="inbox-avatar">${html(person.initials)}</span><span><strong>${html(person.name)}</strong><small>${html(person.id)} · ${html(person.location)} · ${html(person.type)}</small></span>${icon('check')}</button>`).join('') || '<div class="inbox-list-empty" role="status">No customers found.</div>';
  $('#startInboxConversation').disabled = !selectedCustomer;
}

function openCustomerPicker() {
  modalReturnFocus = document.activeElement;
  selectedCustomer = null;
  $('#inboxCustomerSearch').value = '';
  renderCustomers();
  modal.hidden = false;
  $('#appShell').inert = true;
  $('#inboxCustomerSearch').focus();
}

function closeCustomerPicker() {
  modal.hidden = true;
  $('#appShell').inert = false;
  modalReturnFocus?.focus();
}

function startConversation() {
  const customer = customers.find((item) => item.id === selectedCustomer);
  if (!customer) return;
  let person = conversations.find((item) => item.customerId === customer.id);
  if (!person) {
    person = { ...customer, id: `conversation-${customer.id.toLowerCase()}-email`, customerId: customer.id, preview: 'New conversation', time: 'Now', unread: false, attachment: false };
    conversations.unshift(person);
    messages.set(person.id, []);
  }
  closeCustomerPicker();
  openConversation(person.id, true);
}

function setFilter(next) {
  filter = next;
  $$('[data-inbox-filter]').forEach((tab) => {
    const active = tab.dataset.inboxFilter === filter;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  renderList();
}

function setMobileNavigation(open) {
  $('#appShell').classList.toggle('is-mobile-open', open);
  document.body.classList.toggle('sidebar-open', open);
  $('#inboxMobileNavButton')?.setAttribute('aria-expanded', String(open));
  if (open) $('#inboxNavLink')?.focus();
  else $('#inboxMobileNavButton')?.focus({ preventScroll: true });
}

function closeMenus() {
  $$('[data-inbox-actions-menu],[data-inbox-template-menu]').forEach((menu) => { menu.hidden = true; });
  $$('[data-inbox-actions],[data-inbox-template-button]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
}

$('#inboxSearch').addEventListener('input', renderList);
$('#inboxCustomerSearch').addEventListener('input', renderCustomers);
$('#inboxCreateButton').addEventListener('click', openCustomerPicker);
$('#closeInboxCreate').addEventListener('click', closeCustomerPicker);
$('#cancelInboxCreate').addEventListener('click', closeCustomerPicker);
$('#startInboxConversation').addEventListener('click', startConversation);
modal.addEventListener('click', (event) => { if (event.target === modal) closeCustomerPicker(); });

document.addEventListener('input', (event) => {
  if (event.target.matches('#inboxEmailSubject,#inboxEmailBody')) { saveDraft(); updateSendButton(); }
});
document.addEventListener('change', (event) => {
  if (event.target.id !== 'inboxAttachmentInput') return;
  saveDraft();
  const draft = drafts.get(selectedId) || { subject: '', body: '' };
  draft.attachment = event.target.files[0]?.name || '';
  drafts.set(selectedId, draft);
  $('#inboxAttachmentName').textContent = draft.attachment;
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('button,a');
  if (!button) return;
  if (!button.closest('.customer-mail-template-anchor')) closeMenus();
  if (button.matches('[data-inbox-conversation]')) openConversation(button.dataset.inboxConversation);
  else if (button.matches('[data-inbox-filter]')) setFilter(button.dataset.inboxFilter);
  else if (button.matches('[data-inbox-close]')) closeConversation();
  else if (button.matches('[data-inbox-start]')) openCustomerPicker();
  else if (button.matches('[data-inbox-reply]')) { composerOpen = true; renderThread(); $('#inboxEmailSubject').focus(); }
  else if (button.matches('[data-inbox-collapse]')) { saveDraft(); composerOpen = false; renderThread(); $('[data-inbox-reply]').focus(); }
  else if (button.matches('[data-inbox-discard]')) { drafts.delete(selectedId); composerOpen = false; renderThread(); $('[data-inbox-reply]').focus(); }
  else if (button.matches('[data-inbox-send]')) sendDemoMessage();
  else if (button.matches('[data-inbox-customer]')) { selectedCustomer = button.dataset.inboxCustomer; renderCustomers(); $(`[data-inbox-customer="${selectedCustomer}"]`).focus(); }
  else if (button.matches('[data-inbox-actions],[data-inbox-template-button]')) {
    const menu = button.matches('[data-inbox-actions]') ? $('[data-inbox-actions-menu]') : $('[data-inbox-template-menu]');
    const wasHidden = menu.hidden;
    closeMenus();
    menu.hidden = !wasHidden;
    button.setAttribute('aria-expanded', String(wasHidden));
    if (wasHidden) $('button', menu)?.focus();
  } else if (button.matches('[data-inbox-template]')) {
    const template = templates[button.dataset.inboxTemplate];
    $('#inboxEmailSubject').value = template.subject;
    $('#inboxEmailBody').value = template.body;
    saveDraft(); updateSendButton(); closeMenus(); $('#inboxEmailBody').focus();
  } else if (button.matches('[data-inbox-mark-unread]')) {
    selectedConversation().unread = true;
    renderList(); closeMenus(); notify(`${selectedConversation().name} marked unread`); $('[data-inbox-actions]').focus();
  } else if (button.matches('[data-inbox-delete]')) {
    const person = selectedConversation();
    conversations.splice(conversations.indexOf(person), 1);
    messages.delete(person.id); drafts.delete(person.id); closeConversation();
    notify('Conversation removed from this demo Inbox.'); $('#inboxSearch').focus();
  } else if (button.id === 'inboxMobileNavButton') setMobileNavigation(true);
  else if (button.id === 'sidebarBackdrop') setMobileNavigation(false);
  else if (button.id === 'collapseButton') {
    const collapsed = $('#appShell').classList.toggle('is-collapsed');
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  } else if (button.id === 'shellSearchLabel') $('#inboxSearch').focus();
  else if (button.closest('#primarySidebar') && button.matches('a')) {
    event.preventDefault();
    if (button.id === 'inboxNavLink') { closeConversation(); setMobileNavigation(false); }
    else notify(`${button.textContent.trim()} is outside this Inbox prototype.`);
  } else if (button.id === 'shellBackButton' || button.id === 'shellBreadcrumbRoot') {
    notify('Home is outside this Inbox prototype.');
  } else if (button.id === 'shellHelpButton') notify('Inbox demo: search, filter, open a conversation, or add a new one.');
  else if (button.id === 'shellNotificationsButton') notify('Notification details are outside this Inbox prototype.');
  else if (button.id === 'shellAccountButton') notify('Rishi Charan · Paryatech Travel');
  else if (button.closest('#customerNotesShortcut')) notify('Inbox notes are outside this screen prototype.');
  else if (button.dataset.shellAction) notify(`${button.dataset.shellAction} is outside this Inbox prototype.`);
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (modal.hidden) $('#inboxSearch').focus(); }
  if (event.key === 'Escape') {
    if (!modal.hidden) closeCustomerPicker();
    else if ($('#appShell').classList.contains('is-mobile-open')) setMobileNavigation(false);
    else if ($$('[data-inbox-actions-menu],[data-inbox-template-menu]').some((menu) => !menu.hidden)) {
      const trigger = $('[data-inbox-actions][aria-expanded="true"],[data-inbox-template-button][aria-expanded="true"]');
      closeMenus(); trigger?.focus();
    } else if (composerOpen) { saveDraft(); composerOpen = false; renderThread(); $('[data-inbox-reply]')?.focus(); }
    else if (selectedId) closeConversation();
  }
  const tab = event.target.closest('[data-inbox-filter]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const tabs = $$('[data-inbox-filter]');
    let index = tabs.indexOf(tab);
    if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setFilter(tabs[index].dataset.inboxFilter); tabs[index].focus();
  }
  const menu = event.target.closest('[role="menu"]');
  if (menu && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const options = $$('button', menu);
    const current = options.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next]?.focus();
  }
  if (!modal.hidden && event.key === 'Tab') {
    const controls = $$('button:not([disabled]),input:not([disabled]),[tabindex="0"]', modal).filter((element) => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

// These utilities are inline demo actions, not unimplemented ARIA popovers.
for (const id of ['shellSearchLabel', 'shellNotificationsButton', 'shellAccountButton']) {
  const control = $(`#${id}`);
  for (const attribute of ['aria-haspopup', 'aria-controls', 'aria-expanded']) control?.removeAttribute(attribute);
}
modal.hidden = true;
renderList();
