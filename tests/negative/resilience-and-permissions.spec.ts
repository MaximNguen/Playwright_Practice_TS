import * as allure from 'allure-js-commons';
import {
  INVALID_EMAIL_REGISTRATION,
  INVALID_PASSWORD_REGISTRATION,
} from '@/data/registration';
import { ADMIN, EMPLOYEE, MANAGER } from '@/data/users';
import { expect, test } from '@/fixtures/test';
import { loginAs } from '@/utils/auth';
import { uniqueEmail } from '@/utils/unique';

test.describe('UI: негативные и права', { tag: '@negative' }, () => {
  test('Неверный вход не покидает страницу логина', async ({ page, loginPage }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Аутентификация');

    await loginPage.openPage();
    await loginPage.fillLogin('missing@example.com', 'wrong-password');
    await loginPage.submitLogin();
    await page.locator('.login-msg').waitFor();

    await expect(page).toHaveURL(/\/login$/);
  });

  test('Некорректная регистрация не отправляется', async ({ page, loginPage }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Аутентификация');

    await loginPage.openPage();
    await loginPage.switchToRegister();
    const form = page.locator('form.login-form');
    await form.locator('input').nth(0).fill(INVALID_EMAIL_REGISTRATION.firstName);
    await form.locator('input').nth(1).fill(INVALID_EMAIL_REGISTRATION.email);
    await form.locator('input').nth(2).fill(INVALID_PASSWORD_REGISTRATION.password);
    await page.getByRole('button', { name: 'Отправить заявку' }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(
      await form
        .locator('input[type="email"]')
        .evaluate((element) => !(element as HTMLInputElement).validity.valid),
    ).toBe(true);
  });

  test('Сотрудник перенаправляется из администрирования', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Права доступа');

    const app = await loginAs(page, EMPLOYEE);
    await app.openRoute('/admin');
    await page.waitForURL('**/dashboard');

    await expect(page.getByText('Администрирование', { exact: true })).not.toBeVisible();
  });

  test('Сотрудник не видит действий управления', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Права доступа');

    const app = await loginAs(page, EMPLOYEE);
    await app.openRoute('/departments');
    await expect(page.getByRole('button', { name: 'Создать', exact: true })).not.toBeVisible();

    await app.openRoute('/employees');
    await expect(page.getByRole('button', { name: 'Добавить', exact: true })).not.toBeVisible();
  });

  test('Пустая задача не создаётся', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Задачи');

    const app = await loginAs(page, MANAGER);
    await app.openRoute('/calendar');
    await app.waitForText('Календарь');
    await page.locator('button.create-btn').click();
    await app.clickDialogButtonByText('Создать');

    await expect(page.getByText('Укажите название', { exact: true })).toBeVisible();
  });

  test('Форма сотрудника отклоняет короткий пароль', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Сотрудники');

    const app = await loginAs(page, ADMIN);
    await app.openRoute('/employees');
    await page.waitForURL('**/employees');
    await page.getByRole('button', { name: 'Добавить', exact: true }).click();
    await app.fillByLabel('ФИО', 'Invalid Password User');
    await app.fillByLabel('Email', uniqueEmail('short-password'));
    await app.fillByLabel('Временный пароль', INVALID_PASSWORD_REGISTRATION.password);
    await app.clickDialogButtonByText('Сохранить');

    await expect(page.getByText('Минимум 8 символов', { exact: true })).toBeVisible();
  });

  test('Неизвестный маршрут обрабатывается', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Навигация');

    await loginAs(page, MANAGER);
    await page.goto('/not-a-real-route');
    await page.waitForURL('**/dashboard');

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('Диалог задачи отменяется без изменения данных', async ({ page }) => {
    await allure.feature('UI: негативные и права');
    await allure.story('Задачи');

    const app = await loginAs(page, MANAGER);
    await app.openRoute('/calendar');
    await app.waitForText('Календарь');
    await page.locator('button.create-btn').click();
    await app.fillByLabel('Название', 'Cancelled task');
    await page.locator('.p-dialog:visible').getByRole('button', { name: 'Отмена', exact: true }).click();
    await page.locator('.p-dialog:visible').waitFor({ state: 'hidden' });

    await expect(page.getByText('Cancelled task', { exact: true })).not.toBeVisible();
  });
});
