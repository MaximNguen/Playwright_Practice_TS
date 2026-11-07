import type { Locator, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';

export class BasePage {
  constructor(protected readonly page: Page) {}

  findElement(selector: string): Locator {
    return this.page.locator(selector).first();
  }

  async findElements(selector: string): Promise<Locator[]> {
    return this.page.locator(selector).all();
  }

  async click(selector: string): Promise<void> {
    await allure.step(`Клик по элементу: ${selector}`, async () => {
      await this.findElement(selector).click();
    });
  }

  async safeClick(selector: string): Promise<boolean> {
    const clicked = await allure.step(`Безопасный клик по элементу: ${selector}`, async () => {
      try {
        await this.page.locator(selector).first().click({ timeout: 5_000 });
        return true;
      } catch {
        return false;
      }
    });
    return clicked;
  }

  async inputText(element: Locator, text: string): Promise<void> {
    await allure.step('Ввод текста в поле', async () => {
      await element.fill(text);
    });
  }

  async getText(selector: string): Promise<string> {
    const text = await allure.step(`Получение текста элемента: ${selector}`, async () =>
      this.page.locator(selector).first().innerText(),
    );
    return text.trim();
  }

  async open(url: string): Promise<void> {
    await allure.step(`Открытие страницы: ${url}`, async () => {
      await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    });
  }

  getCurrentUrl(): string {
    return this.page.url();
  }

  async goBackPage(): Promise<void> {
    await allure.step('Возврат на предыдущую страницу', async () => {
      await this.page.goBack({ waitUntil: 'domcontentloaded' });
    });
  }

  async waitForText(text: string, timeout = 15): Promise<void> {
    await allure.step(`Ожидание текста: ${text}`, async () => {
      await this.page
        .getByText(text, { exact: false })
        .filter({ visible: true })
        .first()
        .waitFor({ timeout: timeout * 1000 });
    });
  }

  async pageContains(text: string): Promise<boolean> {
    const contains = await allure.step(`Проверка наличия текста: ${text}`, async () => {
      const bodyText = await this.page.locator('body').innerText();
      return bodyText.includes(text);
    });
    return contains;
  }
}
