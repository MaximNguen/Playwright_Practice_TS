import * as allure from 'allure-js-commons';
import { ROUTES, SIDEBAR_ITEMS } from '@/data/routes';
import { ADMIN, EMPLOYEE, MANAGER } from '@/data/users';
import { expect, test } from '@/fixtures/test';
import { loginAs } from '@/utils/auth';
import { uniqueEmail, uniqueName } from '@/utils/unique';

test.describe('UI: Playwright', () => {
  test.describe('Маршруты и навигация', () => {
    for (const route of ROUTES) {
      test(`Раздел ${route.path} отображается после входа`, async ({ page }) => {
        await allure.feature('UI: Playwright');
        await allure.story('Маршруты и навигация');
        await allure.parameter('path', route.path);

        const app = await loginAs(page, MANAGER);
        await app.openRoute(route.path);

        for (const text of route.expectedTexts) {
          await app.waitForText(text);
        }
      });
    }

    test('Навигация по боковому меню', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Маршруты и навигация');

      const app = await loginAs(page, MANAGER);
      for (const item of SIDEBAR_ITEMS) {
        await app.clickNavItem(item.label);
        await page.waitForURL(`**${item.route}`);
      }
    });

    test('Неизвестный маршрут обрабатывается', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Маршруты и навигация');

      await loginAs(page, MANAGER);
      await page.goto('/not-a-real-route');
      await page.waitForURL('**/dashboard');

      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });

  test.describe('Аутентификация', () => {
    test('Валидация входа и регистрация', async ({ loginPage }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await loginPage.submitLogin();

      expect(await loginPage.getLoginErrorText()).toBe('Введите email и пароль');
    });

    test('Форма регистрации отображает выбор офиса', async ({ page, loginPage }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await loginPage.switchToRegister();
      await loginPage.waitForOffices();

      await expect(page.getByRole('combobox', { name: 'Выберите офис' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Отправить заявку' })).toBeVisible();
    });
  });

  test.describe('Права доступа', () => {
    test('Сотрудник не может открыть администрирование', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Права доступа');

      const app = await loginAs(page, EMPLOYEE);
      await app.openRoute('/admin');
      await page.waitForURL('**/dashboard');
      await app.waitForText('Панель управления офисом');
    });
  });

  test.describe('Задачи', () => {
    test('Менеджер создаёт задачу с вложением', async ({ page, uploadFile }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Задачи');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/calendar');
      const taskName = uniqueName('Файл-задача');

      await page.locator('button.create-btn').click();
      await app.fillByLabel('Название', taskName);
      await app.selectFirstAssignee();
      await app.uploadFile(uploadFile.path);
      await page.locator('.file-item').filter({ hasText: uploadFile.name }).waitFor();
      await page.locator('.uploading-indicator').waitFor({ state: 'hidden', timeout: 30_000 });

      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.url().split('?')[0].endsWith('/tasks'),
        { timeout: 30_000 },
      );
      await app.clickDialogButtonByText('Создать');
      const response = await responsePromise;

      expect(response.status()).toBe(201);
      expect(((await response.json()) as { title: string }).title).toBe(taskName);
    });
  });

  test.describe('Отделы', () => {
    test('Администратор создаёт отдел', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Отделы');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/departments');
      const departmentName = uniqueName('Отдел');

      await page.getByRole('button', { name: 'Создать', exact: true }).click();
      await app.fillByLabel('Название', departmentName);
      await app.clickDialogButtonByText('Создать');
      await app.waitForText(departmentName);
    });
  });

  test.describe('Сотрудники', () => {
    test('Администратор добавляет сотрудника', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Сотрудники');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/employees');
      const email = uniqueEmail('employee');

      await page.getByRole('button', { name: 'Добавить', exact: true }).click();
      await app.fillByLabel('ФИО', uniqueName('Сотрудник'));
      await app.fillByLabel('Email', email);
      await app.fillByLabel('Телефон', '+7 900 222-22-22');
      await app.fillByLabel('Временный пароль', 'Demo12345');
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(email);
    });
  });

  test.describe('Материалы и диск', () => {
    test('Администратор создаёт папку на диске', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Материалы и диск');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/materials/disk');
      const folderName = uniqueName('Папка');

      await page.getByRole('button', { name: 'Создать папку', exact: true }).click();
      await app.fillByLabel('Название', folderName);
      await page.locator('.p-dialog:visible').getByRole('button', { name: 'Создать', exact: true }).click();
      await app.waitForText('Папка создана');

      await expect(page.getByText(folderName, { exact: true })).toBeVisible();
    });
  });

  test.describe('Администрирование', () => {
    test('Администратор создаёт офис', async ({ page }) => {
      await allure.feature('UI: Playwright');
      await allure.story('Администрирование');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/admin');
      await page.locator('.admin-tab').filter({ hasText: 'Офисы' }).click();
      await page.getByRole('button', { name: 'Создать офис', exact: true }).click();
      const officeName = uniqueName('Офис');

      await app.fillByLabel('Название', officeName);
      await app.fillByLabel('Город', 'Казань');
      await app.fillByLabel('Часовой пояс', 'Europe/Moscow');
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(officeName);
    });
  });
});
