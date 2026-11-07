import type { Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { env } from '../config/env';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  static readonly PATH = '/login';

  constructor(page: Page) {
    super(page);
  }

  get url(): string {
    return `${env.baseUrl}${LoginPage.PATH}`;
  }

  async openPage(): Promise<this> {
    await allure.step('Открытие страницы логина', async () => {
      await this.open(this.url);
      await this.page.locator('form.login-form').waitFor();
    });
    return this;
  }

  async switchToLogin(): Promise<this> {
    await allure.step('Переключение на форму входа', async () => {
      const switchButton = this.page.getByRole('button', { name: 'Уже есть аккаунт? Войти' });
      if ((await switchButton.count()) > 0) {
        await switchButton.click();
      }
      await this.page.locator('form.login-form').waitFor();
    });
    return this;
  }

  async switchToRegister(): Promise<this> {
    await allure.step('Переключение на форму регистрации', async () => {
      await this.page.getByRole('button', { name: 'Регистрация' }).click();
      await this.page.locator('form.login-form').waitFor();
    });
    return this;
  }

  async fillLogin(email: string, password: string): Promise<this> {
    await allure.step('Заполнение email и пароля', async () => {
      const form = this.page.locator('form.login-form');
      await form.locator('input[type="email"]').fill(email);
      await form.locator('input[type="password"]').fill(password);
    });
    return this;
  }

  async submitLogin(): Promise<this> {
    await allure.step('Отправка формы входа', async () => {
      await this.page.getByRole('button', { name: 'Войти', exact: true }).click();
    });
    return this;
  }

  async login(email: string, password: string): Promise<this> {
    await allure.step('Вход в систему', async () => {
      await this.switchToLogin();
      await this.fillLogin(email, password);
      await this.submitLogin();
    });
    return this;
  }

  async waitForDashboard(timeout = 15): Promise<this> {
    await allure.step('Ожидание перехода на дашборд', async () => {
      await this.page.waitForURL('**/dashboard', { timeout: timeout * 1000 });
    });
    return this;
  }

  async getLoginErrorText(): Promise<string> {
    const text = await allure.step('Получение текста ошибки входа', async () =>
      this.page.locator('.login-msg').innerText(),
    );
    return text.trim();
  }

  async getRegisterErrorTexts(): Promise<string[]> {
    const texts = await allure.step('Получение текстов ошибок регистрации', async () =>
      this.page.locator('.p-message-error').allInnerTexts(),
    );
    return texts.map((text) => text.trim());
  }

  async fillRegistration(firstName: string, email: string, password: string): Promise<this> {
    await allure.step('Заполнение формы регистрации', async () => {
      const fields = this.page.locator('form.login-form input');
      await fields.nth(0).fill(firstName);
      await fields.nth(1).fill(email);
      await fields.nth(2).fill(password);
    });
    return this;
  }

  async waitForOffices(timeout = 15): Promise<this> {
    await allure.step('Ожидание загрузки офисов', async () => {
      await this.page.getByText('Офис', { exact: true }).waitFor({ timeout: timeout * 1000 });
      await this.page
        .getByRole('combobox', { name: 'Выберите офис' })
        .waitFor({ timeout: timeout * 1000 });
    });
    return this;
  }

  async selectOffice(index = 1): Promise<this> {
    await allure.step('Выбор офиса', async () => {
      await this.page.locator('h2.login-title').click({ position: { x: 5, y: 5 } });
      await this.page.locator('.p-select-dropdown').last().click({ force: true });
      await this.page.locator('[role="listbox"]').waitFor();
      const options = this.page.locator('[role="listbox"] [role="option"]');
      await options.first().waitFor();
      await options.nth(index).click({ force: true });
    });
    return this;
  }

  async acceptTerms(): Promise<this> {
    await allure.step('Принятие условий', async () => {});
    return this;
  }

  async submitRegistration(): Promise<this> {
    await allure.step('Отправка заявки на регистрацию', async () => {
      await this.page.getByRole('button', { name: 'Отправить заявку' }).click();
    });
    return this;
  }

  async register(firstName: string, email: string, password: string, officeIndex = 1): Promise<this> {
    await allure.step('Регистрация нового пользователя', async () => {
      await this.switchToRegister();
      await this.waitForOffices();
      await this.fillRegistration(firstName, email, password);
      await this.selectOffice(officeIndex);
      await this.acceptTerms();
      await this.submitRegistration();
    });
    return this;
  }

  async waitForRegistrationMessage(timeout = 15): Promise<string> {
    const message = await allure.step('Ожидание сообщения о регистрации', async () => {
      const locator = this.page.locator('.login-msg');
      await locator.waitFor({ timeout: timeout * 1000 });
      return locator.innerText();
    });
    return message.trim();
  }
}
