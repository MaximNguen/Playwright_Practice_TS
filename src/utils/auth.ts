import type { Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { env } from '../config/env';
import type { TestUser } from '../data/users';
import { AppPage } from '../pages/AppPage';
import { LoginPage } from '../pages/LoginPage';

export async function loginAs(
  page: Page,
  user: TestUser | string,
  maxRetries = 3,
): Promise<AppPage> {
  const email = typeof user === 'string' ? user : user.email;
  return allure.step('Вход в систему', async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      try {
        const loginPage = new LoginPage(page);
        await loginPage.openPage();
        await loginPage.login(email, env.demoPassword);
        await loginPage.waitForDashboard();
        return new AppPage(page);
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new Error(`Не удалось войти в систему как ${email}`);
  });
}
