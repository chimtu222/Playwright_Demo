import { Page, Locator } from '@playwright/test';
import { LocatorDefinition } from '../types';

export class LocatorFactory {
  static getLocator(
    page: Page,
    locatorDef: LocatorDefinition
  ): Locator {

    switch (locatorDef.type) {

      case 'role':

        return page.getByRole(
          locatorDef.value as any,
          {
            name: locatorDef.name
          }
        );

      case 'text':
        return page.getByText(
          locatorDef.value,
          {
            exact: locatorDef.exact
          }
        );

      case 'label':
        return page.getByLabel(
          locatorDef.value
        );

      case 'placeholder':
        return page.getByPlaceholder(
          locatorDef.value
        );

      case 'testId':
        return page.getByTestId(
          locatorDef.value
        );

      case 'css':
        return page.locator(
          locatorDef.value
        );

      case 'xpath':
        return page.locator(
          locatorDef.value
        );

      default:
        throw new Error(
          `Unsupported locator type: ${locatorDef.type}`
        );
    }
  }
}