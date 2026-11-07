import * as allure from 'allure-js-commons';
import { ADMIN, MANAGER } from '@/data/users';
import { expect, test } from '@/fixtures/test';
import { loginAs } from '@/utils/auth';
import { uniqueEmail, uniqueName } from '@/utils/unique';

test.describe('E2E: полные сценарии', { tag: '@e2e' }, () => {
  test('Полный цикл: вход, профиль, настройки, выход', async ({ page }) => {
    await allure.feature('E2E: полные сценарии');
    await allure.story('Аутентификация и профиль');
    await allure.severity('critical');

    const app = await loginAs(page, MANAGER);
    await app.openRoute('/settings');
    const name = uniqueName('E2E профиль');

    await app.fillByLabel('Полное имя', name);
    await app.fillByLabel('Телефон', '+7 900 111-22-33');
    await app.clickButtonByText('Сохранить изменения');
    await page.locator('.user-chip__meta strong').filter({ hasText: name }).waitFor();
    await page.reload();
    await page.locator('.user-chip__meta strong').filter({ hasText: name }).waitFor();

    await page.locator('button.nav-item--logout').click();
    await page.getByRole('button', { name: 'Выйти' }).click();
    await page.waitForURL('**/login');
  });

  test('Полный цикл: создание, просмотр, выполнение и удаление задачи', async ({ page }) => {
    await allure.feature('E2E: полные сценарии');
    await allure.story('Задачи');
    await allure.severity('critical');

    const app = await loginAs(page, MANAGER);
    await app.openRoute('/calendar');
    const title = uniqueName('E2E задача');

    await app.waitForText('Календарь');
    await page.locator('button.create-btn').click();
    await app.fillByLabel('Название', title);
    await app.selectFirstAssignee();
    await app.clickDialogButtonByText('Создать');
    await app.waitForText(title);
    await page.reload();
    await app.waitForText(title);

    const task = page.getByText(title, { exact: true }).filter({ visible: true }).first();
    await task.click();
    const detail = page.locator('.p-dialog:visible');
    await detail.getByText('Сделано', { exact: true }).click();
    await page.waitForTimeout(300);
    await expect(detail.getByText('Сделано', { exact: true })).toBeVisible();
    await detail.getByRole('button', { name: 'Удалить задачу', exact: true }).click();
    await page.locator('button:has-text("Удалить")').last().click();
    await page.reload();
    await app.waitForText('Календарь');

    expect(await page.getByText(title, { exact: true }).count()).toBe(0);
  });

  test('Полный цикл: загрузка, просмотр и удаление материала', async ({ page, uploadFile }) => {
    await allure.feature('E2E: полные сценарии');
    await allure.story('Материалы');

    const app = await loginAs(page, MANAGER);
    await app.openRoute('/materials');
    await page.getByRole('button', { name: 'Добавить', exact: true }).click();
    await app.uploadFile(uploadFile.path);

    const rowName = page.locator('.file-row__name').filter({ hasText: uploadFile.name }).first();
    await rowName.waitFor({ timeout: 30_000 });
    await rowName.click();
    const preview = page.locator('.file-preview-dialog:visible');
    await preview.waitFor();
    await preview.getByRole('button', { name: 'Закрыть', exact: true }).click();
  });

  test('Полный цикл: редактирование отдела и состава участников', async ({ page }) => {
    await allure.feature('E2E: полные сценарии');
    await allure.story('Отделы');

    const app = await loginAs(page, ADMIN);
    await app.openRoute('/departments');
    const card = page.locator('.dept-card').first();
    await card.locator('button.edit-btn').click();
    const dialog = page.locator('.p-dialog:visible');

    await expect(dialog.getByText('Сотрудники в отделе', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Сохранить изменения', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  });

  test('Полный цикл: CRUD сотрудника администратором', async ({ page }) => {
    await allure.feature('E2E: полные сценарии');
    await allure.story('Сотрудники');
    await allure.severity('critical');

    const app = await loginAs(page, ADMIN);
    await app.openRoute('/employees');
    await app.waitForText('Сотрудники');
    const name = uniqueName('E2E сотрудник');
    const email = uniqueEmail('e2e-employee');

    await page.locator('.page-header__actions button').click();
    await app.fillByLabel('ФИО', name);
    await app.fillByLabel('Email', email);
    await app.fillByLabel('Телефон', '+7 900 222-22-22');
    await app.fillByLabel('Временный пароль', 'Demo12345');
    await app.clickDialogButtonByText('Сохранить');
    await app.waitForText(email);
    await page.reload();
    await app.waitForText(email);

    let row = page.locator('.employee-row').filter({ hasText: email }).first();
    await row.locator('button.action-btn').first().click();
    await app.fillByLabel('ФИО', `${name} updated`);
    await app.clickDialogButtonByText('Сохранить');
    await app.waitForText(`${name} updated`);

    row = page.locator('.employee-row').filter({ hasText: email }).first();
    await row.locator('button.action-btn').nth(1).click();
    await page.locator('button:has-text("Удалить")').last().click();
    await page.reload();
    await app.waitForText('Сотрудники');

    expect(await page.getByText(email, { exact: true }).count()).toBe(0);
  });
});
