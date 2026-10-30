import { test, expect } from '@playwright/test';

const rows = (page) => page.locator('#inboxConversationList [data-inbox-conversation]');
const rishiRow = (page) => page.locator('[data-inbox-conversation="conversation-rishi-email"]');

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: window.innerWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/lab/t/inbox/C');
  await expect(rows(page)).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
});

test('initial source layout and locally loaded assets', async ({ page }, testInfo) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.reload();
  await expect(rows(page)).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await expect(page.getByRole('heading', { name: 'All inbox', exact: true })).toBeVisible();
  await expect(page.locator('#inboxHeaderUnread')).toHaveText('7');
  await expect(page.locator('#inboxCreateBackdrop')).toBeHidden();
  await expectNoHorizontalOverflow(page);
  expect(await page.evaluate(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => [...document.fonts].every((font) => font.status === 'loaded' || font.status === 'unloaded'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath(`initial-${testInfo.project.name}.png`), fullPage: false, animations: 'disabled' });
  expect(pageErrors).toEqual([]);
});

test('filters retain the source counts and keyboard tab behavior', async ({ page }) => {
  for (const [name, count] of [['Read', 5], ['Unread', 7], ['With attachments', 4], ['All', 12]]) {
    const tab = page.getByRole('tab', { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(rows(page)).toHaveCount(count);
  }
  await page.getByRole('tab', { name: 'All', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Read', exact: true })).toBeFocused();
  await expect(rows(page)).toHaveCount(5);
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'With attachments', exact: true })).toBeFocused();
  await expect(rows(page)).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
});

test('search narrows conversations, shows an empty state, and clears', async ({ page }) => {
  const search = page.locator('#inboxSearch');
  await search.fill('rishi');
  await expect(rows(page)).toHaveCount(1);
  await expect(rishiRow(page)).toContainText('Rishi Charan');
  await search.fill('no-matching-conversation-8734');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByText('No conversations found.', { exact: true })).toBeVisible();
  await search.clear();
  await expect(rows(page)).toHaveCount(12);
  await page.keyboard.press('Control+k');
  await expect(search).toBeFocused();
});

test('opening a conversation marks it read, supports mark unread, and closes', async ({ page }) => {
  await rishiRow(page).click();
  await expect(page.locator('.inbox-thread-person h2')).toHaveText('Rishi Charan');
  await expect(page.locator('.inbox-email-card')).toHaveCount(2);
  await expect(page.locator('#inboxHeaderUnread')).toHaveText('6');
  await expect(rishiRow(page)).toHaveAttribute('data-inbox-unread', '0');
  await page.getByRole('button', { name: 'Conversation actions', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Mark unread', exact: true }).click();
  await expect(page.locator('#inboxHeaderUnread')).toHaveText('7');
  await expect(rishiRow(page)).toHaveAttribute('data-inbox-unread', '1');
  await page.getByRole('button', { name: 'Close conversation', exact: true }).click();
  await expect(page.locator('.inbox-thread-header')).toHaveCount(0);
  await expect(rishiRow(page)).toBeFocused();
  await expectNoHorizontalOverflow(page);
});

test('reply templates, attachments, and send stay local', async ({ page }) => {
  const mutationRequests = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) mutationRequests.push(request.url());
  });
  await rishiRow(page).click();
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(page.locator('#inboxEmailSubject')).toBeFocused();
  const send = page.getByRole('button', { name: 'Send', exact: true });
  await expect(send).toBeDisabled();
  await page.getByRole('button', { name: 'Template', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Request documents Ask for missing travel files', exact: true }).click();
  await expect(page.locator('#inboxEmailSubject')).toHaveValue('Request documents');
  await expect(page.locator('#inboxEmailBody')).toHaveValue(/Please share the missing travel documents/);
  await expect(send).toBeEnabled();
  await page.locator('#inboxEmailSubject').fill('Updated hotel voucher');
  await page.locator('#inboxEmailBody').fill('Hello <team> & welcome. Please review this demo voucher.');
  await page.locator('#inboxAttachmentInput').setInputFiles({
    name: 'voucher.txt', mimeType: 'text/plain', buffer: Buffer.from('Demo voucher attachment'),
  });
  await expect(page.locator('#inboxAttachmentName')).toHaveText('voucher.txt');
  await send.click();
  await expect(page.locator('.inbox-email-card')).toHaveCount(3);
  const sent = page.locator('.inbox-email-card').last();
  await expect(sent).toContainText('Updated hotel voucher');
  await expect(sent.locator('p')).toHaveText('Hello <team> & welcome. Please review this demo voucher.');
  await expect(sent).toContainText('voucher.txt');
  await expect(page.locator('#toast')).toHaveText('Saved in this demo conversation. No email was sent.');
  await expect(page.getByRole('button', { name: 'Reply', exact: true })).toBeFocused();
  expect(mutationRequests).toEqual([]);
  await expectNoHorizontalOverflow(page);
});

test('customer picker searches, restores focus, and creates a local draft', async ({ page }) => {
  const add = page.getByRole('button', { name: 'Add conversation', exact: true });
  await add.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#inboxCustomerSearch')).toBeFocused();
  await expect(page.getByRole('option')).toHaveCount(16);
  await expect(page.getByRole('button', { name: 'Start conversation', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close new conversation', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(add).toBeFocused();
  await add.click();
  await page.locator('#inboxCustomerSearch').fill('CUST-0013');
  await expect(page.getByRole('option')).toHaveCount(1);
  const customer = page.getByRole('option', { name: /Ankit Kapoor/ });
  await customer.click();
  await expect(customer).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Start conversation', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.inbox-thread-person h2')).toHaveText('Ankit Kapoor');
  await expect(page.locator('#inboxEmailSubject')).toBeFocused();
  await expect(rows(page)).toHaveCount(13);
  await expectNoHorizontalOverflow(page);
});

test('Escape closes menus, composer and conversation in sequence', async ({ page }) => {
  await rishiRow(page).click();
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  const template = page.getByRole('button', { name: 'Template', exact: true });
  await template.click();
  await expect(page.locator('[data-inbox-template-menu]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-inbox-template-menu]')).toBeHidden();
  await expect(template).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.inbox-email-compose')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reply', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('.inbox-thread-header')).toHaveCount(0);
  await expect(rishiRow(page)).toBeFocused();
});

test('mobile navigation and conversation back retain the list layout', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile navigation is not shown at desktop width.');
  const navigation = page.getByRole('button', { name: 'Open navigation', exact: true });
  await expect(navigation).toBeVisible();
  await navigation.click();
  await expect(page.locator('#appShell')).toHaveClass(/is-mobile-open/);
  await expect(navigation).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#inboxNavLink')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#appShell')).not.toHaveClass(/is-mobile-open/);
  await expect(navigation).toBeFocused();
  await expect(page.locator('.inbox-list-panel')).toBeVisible();
  await rishiRow(page).click();
  await expect(page.locator('.inbox-list-panel')).toBeHidden();
  await expect(page.locator('#inboxThreadPanel')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Back to conversations', exact: true }).click();
  await expect(page.locator('.inbox-list-panel')).toBeVisible();
  await expect(page.locator('#inboxThreadPanel')).toBeHidden();
  await expect(rishiRow(page)).toBeFocused();
  await expectNoHorizontalOverflow(page);
});
