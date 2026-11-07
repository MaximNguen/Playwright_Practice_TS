import type { Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { env } from '../config/env';
import { BasePage } from './BasePage';

export class AppPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async openRoute(path: string): Promise<this> {
    await allure.step(`Открытие маршрута: ${path}`, async () => {
      await this.page.goto(`${env.baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    });
    return this;
  }

  async clickNavItem(label: string): Promise<this> {
    await allure.step(`Клик по пункту меню: ${label}`, async () => {
      await this.page.locator(`.nav-item[title="${label}"]`).click();
    });
    return this;
  }

  async clickButtonByText(text: string): Promise<this> {
    await allure.step(`Клик по кнопке: ${text}`, async () => {
      const buttons = this.page.locator('button');
      await this.page.waitForFunction(
        (label) =>
          [...document.querySelectorAll('button')].some(
            (button) => button.textContent?.trim() === label,
          ),
        text,
      );
      const contents = await buttons.allTextContents();
      const index = contents.findIndex((content) => content.trim() === text);
      if (index >= 0) {
        await buttons.nth(index).click();
        return;
      }
      let button = this.page.getByRole('button', { name: text, exact: true });
      if ((await button.count()) === 0) {
        button = this.page.getByRole('tab', { name: text, exact: true });
      }
      await button.click();
    });
    return this;
  }

  async clickDialogButtonByText(text: string): Promise<this> {
    await allure.step(`Клик по кнопке диалога: ${text}`, async () => {
      await this.page
        .locator('.p-dialog:visible')
        .getByRole('button', { name: text, exact: true })
        .click();
    });
    return this;
  }

  async clickConfirmButtonByText(text: string): Promise<this> {
    await allure.step(`Клик по кнопке подтверждения: ${text}`, async () => {
      await this.page.locator('button').filter({ hasText: text }).last().click();
    });
    return this;
  }

  async waitForHeading(text: string, timeout = 15): Promise<this> {
    await allure.step(`Ожидание заголовка: ${text}`, async () => {
      await this.page
        .getByRole('heading', { name: text, exact: true })
        .waitFor({ timeout: timeout * 1000 });
    });
    return this;
  }

  async getHeadingText(): Promise<string> {
    const text = await allure.step('Получение текста заголовка', async () =>
      this.page.locator('h1').first().innerText(),
    );
    return text.trim();
  }

  async fillByLabel(label: string, value: string): Promise<this> {
    await allure.step(`Заполнение поля: ${label}`, async () => {
      const labelLocator = this.page.locator('label').filter({ hasText: label }).first();
      let field = labelLocator.locator('xpath=..').locator('input, textarea').first();
      if ((await field.count()) === 0) {
        field = labelLocator.locator('xpath=following::input[1]');
      }
      await field.fill(value);
    });
    return this;
  }

  async uploadFile(path: string): Promise<this> {
    await allure.step('Загрузка файла', async () => {
      await this.page.locator('input[type="file"]').setInputFiles(path);
    });
    return this;
  }

  async selectFirstAssignee(): Promise<this> {
    await allure.step('Выбор первого исполнителя', async () => {
      const dialog = this.page.locator('.p-dialog:visible');
      await dialog.locator('.p-multiselect').first().click();
      const options = this.page.locator('[role="option"]');
      await options.first().click();
      await this.page.waitForTimeout(250);
      const label = dialog.locator('.p-multiselect-label').first();
      if ((await label.count()) === 0 || (await label.innerText()).trim() === 'Выбрать') {
        await options.first().click();
      }
    });
    return this;
  }
}
