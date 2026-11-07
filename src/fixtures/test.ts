import { test as base, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ContentType } from 'allure-js-commons';
import { resolve } from 'node:path';
import { AppPage } from '../pages/AppPage';
import { LoginPage } from '../pages/LoginPage';
import { cleanupUploadFile, createUploadFile, type UploadFile } from '../utils/files';

const UPLOAD_SOURCE = resolve(__dirname, '../../test-data/sample-upload.png');

export interface TestFixtures {
  appPage: AppPage;
  loginPage: LoginPage;
  uploadFile: UploadFile;
}

export const test = base.extend<TestFixtures>({
  appPage: async ({ page }, use) => {
    await use(new AppPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  uploadFile: async ({}, use) => {
    const file = createUploadFile(UPLOAD_SOURCE);
    await use(file);
    cleanupUploadFile(file);
  },
});

test.beforeEach(async () => {
  await allure.epic('People Help System');
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await allure.attachment(
      'Screenshot',
      await page.screenshot({ fullPage: true }),
      ContentType.PNG,
    );
  }
});

export { expect };
