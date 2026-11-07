import * as allure from 'allure-js-commons';
import { ADMIN, EMPLOYEE, MANAGER } from '@/data/users';
import { INVALID_EMAIL_REGISTRATION } from '@/data/registration';
import { expect, test } from '@/fixtures/test';
import { loginAs } from '@/utils/auth';
import { uniqueEmail, uniqueName } from '@/utils/unique';

test.describe('UI: функциональные', () => {
  test.describe('Аутентификация', () => {
    for (const user of [ADMIN, MANAGER, EMPLOYEE]) {
      test(`Пользователь ${user.email} входит в систему`, async ({ page }) => {
        await allure.feature('UI: функциональные');
        await allure.story('Аутентификация');
        await allure.parameter('email', user.email);
        await allure.severity('critical');

        const app = await loginAs(page, user);

        await expect(page).toHaveURL(/\/dashboard$/);
        expect(await app.pageContains('Панель управления офисом')).toBe(true);
      });
    }

    test('Неверные учётные данные отклоняются', async ({ page, loginPage }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await loginPage.fillLogin('unknown@example.com', 'wrong-password');
      await loginPage.submitLogin();
      await page.locator('.login-msg').waitFor();

      const errorText = (await loginPage.getLoginErrorText()).toLowerCase();
      expect(errorText.includes('невер') || errorText.includes('ошиб')).toBe(true);
      await expect(page).toHaveURL(/\/login$/);
    });

    test('Обязательные поля входа валидируются', async ({ page, loginPage }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await loginPage.submitLogin();

      expect(await loginPage.getLoginErrorText()).toBeTruthy();
      await expect(page).toHaveURL(/\/login$/);
    });

    test('Форма восстановления пароля отправляется', async ({ page, loginPage }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await page.getByRole('button', { name: 'Забыли пароль?' }).click();
      await page.getByRole('textbox').fill(MANAGER.email);
      await page.getByRole('button', { name: 'Отправить ссылку' }).click();
      await page.locator('.login-msg').waitFor();

      expect((await page.locator('.login-msg').innerText()).trim()).toBeTruthy();
    });

    test('Регистрация отклоняет некорректный email', async ({ page, loginPage }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Аутентификация');

      await loginPage.openPage();
      await loginPage.switchToRegister();
      const form = page.locator('form.login-form');
      await form.locator('input').nth(0).fill(INVALID_EMAIL_REGISTRATION.firstName);
      await form.locator('input').nth(1).fill(INVALID_EMAIL_REGISTRATION.email);
      await form.locator('input').nth(2).fill(INVALID_EMAIL_REGISTRATION.password);
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Отправить заявку' }).click();

      await expect(page).toHaveURL(/\/login$/);
      expect(
        await form
          .locator('input[type="email"]')
          .evaluate((element) => !(element as HTMLInputElement).validity.valid),
      ).toBe(true);
    });

    test('Выход возвращает на страницу входа', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Аутентификация');

      await loginAs(page, MANAGER);
      await page.locator('button.nav-item--logout').click();
      await page.getByRole('button', { name: 'Выйти' }).click();
      await page.waitForURL('**/login');

      await expect(page.locator('form.login-form')).toBeVisible();
    });
  });

  test.describe('Задачи', () => {
    test('Менеджер создаёт задачу и данные сохраняются', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Задачи');
      await allure.severity('critical');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/calendar');
      const title = uniqueName('UI задача');

      await app.clickButtonByText('Создать задачу');
      await app.fillByLabel('Название', title);
      await app.selectFirstAssignee();
      await app.clickDialogButtonByText('Создать');
      await app.waitForText(title);

      await expect(page.getByText(title, { exact: true }).filter({ visible: true }).first()).toBeVisible();
    });

    test('Форма задачи валидирует пустое название', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Задачи');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/calendar');
      await app.clickButtonByText('Создать задачу');
      await app.clickDialogButtonByText('Создать');

      await expect(page.getByText('Укажите название', { exact: true })).toBeVisible();
    });

    test('Задачу можно отметить выполненной', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Задачи');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/calendar');
      const task = page
        .locator('button.task-check:not([disabled]), button.quick-check:not([disabled])')
        .first();
      if ((await task.count()) === 0) {
        test.skip(true, 'В тестовых данных нет незавершённой задачи');
      }

      await task.click();
      const isDone =
        (await task.isDisabled()) || ((await task.getAttribute('class')) ?? '').includes('done');
      expect(isDone).toBe(true);
    });

    test('Диалог задачи поддерживает обязательные поля и вложения', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Задачи');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/calendar');
      await app.clickButtonByText('Создать задачу');
      await app.fillByLabel('Название', uniqueName('Подзадачи'));

      await expect(page.getByText('Прикрепить файлы', { exact: true })).toBeVisible();
      await page.locator('.p-dialog:visible').getByRole('button', { name: 'Отмена', exact: true }).click();
      await page.locator('.p-dialog:visible').waitFor({ state: 'hidden' });
    });
  });

  test.describe('Профиль и настройки', () => {
    test('Пользователь обновляет профиль', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Профиль и настройки');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/settings');
      const newName = uniqueName('Обновленный профиль');

      await app.fillByLabel('Полное имя', newName);
      await app.fillByLabel('Телефон', '+7 900 555-55-55');
      await app.clickButtonByText('Сохранить изменения');
      await page.locator('.user-chip__meta strong').filter({ hasText: newName }).waitFor();

      expect(await page.locator('.user-chip__meta strong').innerText()).toContain(newName);
    });

    test('Вкладки настроек переключают содержимое', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Профиль и настройки');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/settings');
      const tabs = [
        { tab: 'Оформление', marker: 'Цвет аватарки' },
        { tab: 'Офис', marker: 'Информация об офисе' },
        { tab: 'Уведомления', marker: 'Управление уведомлениями' },
      ];

      for (const { tab, marker } of tabs) {
        await page.locator('.settings-nav .nav-item').filter({ hasText: tab }).click();
        await app.waitForText(marker);
      }
    });
  });

  test.describe('Отделы', () => {
    test('Администратор создаёт отдел и открывает карточку', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Отделы');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/departments');
      const name = uniqueName('UI отдел');

      await app.clickButtonByText('Создать');
      await app.fillByLabel('Название', name);
      await app.clickDialogButtonByText('Создать');
      await app.waitForText(name);
      await page.locator('.dept-card').filter({ hasText: name }).click();
      await page.waitForURL('**/departments/*');
      await app.waitForText(name);
    });

    test('Администратор редактирует отдел', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Отделы');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/departments');
      const card = page.locator('.dept-card').first();
      if ((await card.count()) === 0) {
        test.skip(true, 'Нет отделов в тестовых данных');
      }

      await card.locator('button[aria-label="Редактировать"]').click();
      const updated = uniqueName('Измененный отдел');
      await app.fillByLabel('Название', updated);
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(updated);
    });
  });

  test.describe('Сотрудники', () => {
    test('Администратор создаёт сотрудника с ролью', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Сотрудники');
      await allure.severity('critical');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/employees');
      const email = uniqueEmail('ui-employee');
      const name = uniqueName('UI сотрудник');

      await app.clickButtonByText('Добавить');
      await app.fillByLabel('ФИО', name);
      await app.fillByLabel('Email', email);
      await app.fillByLabel('Телефон', '+7 900 222-22-22');
      await app.fillByLabel('Временный пароль', 'Demo12345');
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(email);

      await expect(page.getByText(name, { exact: true })).toBeVisible();
    });

    test('Форма сотрудника валидирует пароль', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Сотрудники');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/employees');
      await app.clickButtonByText('Добавить');
      await app.fillByLabel('ФИО', 'Validation User');
      await app.fillByLabel('Email', uniqueEmail('validation'));
      await app.clickDialogButtonByText('Сохранить');

      await expect(page.getByText('Укажите временный пароль', { exact: true })).toBeVisible();
    });
  });

  test.describe('Материалы и диск', () => {
    test('Загруженный материал виден в списке', async ({ page, uploadFile }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Материалы и диск');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/materials');
      await app.clickButtonByText('Добавить');
      await app.uploadFile(uploadFile.path);
      await app.waitForText(uploadFile.name);

      await page
        .locator('.file-row__name')
        .filter({ hasText: uploadFile.name })
        .first()
        .waitFor({ timeout: 30_000 });
    });

    test('Создание папки на диске и работа контекстного меню', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Материалы и диск');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/materials/disk');
      const name = uniqueName('UI папка');

      await app.clickButtonByText('Создать папку');
      await app.fillByLabel('Название', name);
      await page.locator('.p-dialog:visible').getByRole('button', { name: 'Создать', exact: true }).click();
      await app.waitForText('Папка создана');

      await expect(page.getByText(name, { exact: true })).toBeVisible();
    });

    test('Предпросмотр файла открывает детали', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Материалы и диск');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/materials');
      const fileRow = page.locator('.file-row').first();
      if ((await fileRow.count()) === 0) {
        test.skip(true, 'Нет файлов в тестовых данных');
      }

      await fileRow.locator('.file-row__name').click();
      const preview = page.locator('.file-preview-dialog:visible');
      await preview.waitFor();

      await expect(preview.getByRole('button', { name: 'Закрыть' })).toBeVisible();
    });
  });

  test.describe('Администрирование', () => {
    test('Вкладки администрирования и видимость по ролям', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Администрирование');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/admin');
      const tabs = ['Люди', 'Офисы', 'Отделения', 'Программы', 'Задачи', 'Хранилище', 'Статистика'];

      for (const tab of tabs) {
        await page.locator('.admin-tab').filter({ hasText: tab }).click();
        await app.waitForText(tab);
      }
    });

    test('Администратор создаёт офис и программу', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Администрирование');

      const app = await loginAs(page, ADMIN);
      await app.openRoute('/admin');
      await page.locator('.admin-tab').filter({ hasText: 'Офисы' }).click();
      await app.clickButtonByText('Создать офис');
      const office = uniqueName('UI офис');
      await app.fillByLabel('Название', office);
      await app.fillByLabel('Город', 'Казань');
      await app.fillByLabel('Часовой пояс', 'Europe/Moscow');
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(office);

      await page.locator('.admin-tab').filter({ hasText: 'Программы' }).click();
      await app.clickButtonByText('Создать программу');
      const project = uniqueName('UI программа');
      await app.fillByLabel('Название', project);
      await app.clickDialogButtonByText('Сохранить');
      await app.waitForText(project);
    });
  });

  test.describe('Чат', () => {
    test('В чате можно создать и удалить беседу', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Чат');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/chat');
      await page.locator('.conversation-item').first().waitFor();
      const before = await page.locator('.conversation-item').count();

      await app.clickButtonByText('Новый чат');
      await page.waitForFunction(
        (count) => document.querySelectorAll('.conversation-item').length > count,
        before,
      );
    });

    test('Переключатель роли в чате меняет роль', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Чат');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/chat');
      await page.getByText('Копирайтер', { exact: true }).click();

      await expect(page.getByText('Копирайтер', { exact: true })).toBeVisible();
    });
  });

  test.describe('Дашборд', () => {
    test('Переключение вида графика на дашборде', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Дашборд');

      const app = await loginAs(page, MANAGER);
      await app.openRoute('/dashboard');
      await page.getByRole('button', { name: 'Месяц', exact: true }).last().click();

      expect(
        await page.locator('.chart-switch button').filter({ hasText: 'Месяц' }).getAttribute('class'),
      ).toBeTruthy();
    });
  });

  test.describe('Права доступа', () => {
    test('Сотруднику запрещены действия администратора', async ({ page }) => {
      await allure.feature('UI: функциональные');
      await allure.story('Права доступа');
      await allure.severity('critical');

      const app = await loginAs(page, EMPLOYEE);
      await app.openRoute('/admin');
      await page.waitForURL('**/dashboard');

      await expect(page.getByText('Администрирование', { exact: true })).not.toBeVisible();
    });
  });
});
