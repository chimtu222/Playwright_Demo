import {
    Page,
    Locator
} from '@playwright/test';

import {
    LocatorDefinition
} from '../types';

export class LocatorFactory {

    static getLocator(
        page: Page,
        locatorDef: LocatorDefinition
    ): Locator {

        switch (
            locatorDef.type
        ) {
            /*
             * Excel format:
             *
             * Locator Type: role
             * Locator Value: button|Login
             *
             * This becomes:
             * page.getByRole('button', { name: 'Login' })
             */
            case 'role': {

                const roleParts =
                    locatorDef.value
                        .split('|')
                        .map(
                            part =>
                                part.trim()
                        );

                const role =
                    roleParts[0];

                const accessibleName =
                    roleParts
                        .slice(1)
                        .join('|')
                        .trim();

                if (!role) {
                    throw new Error(
                        'Role locator requires a role value.'
                    );
                }

                if (
                    !accessibleName
                ) {
                    return page.getByRole(
                        role as any
                    );
                }

                return page.getByRole(
                    role as any,
                    {
                        name:
                            accessibleName,

                        exact:
                            true
                    }
                );
            }

            /*
             * Excel format:
             *
             * Locator Type: id
             * Locator Value: login-button
             */
            case 'id': {

                const idValue =
                    locatorDef.value
                        .trim()
                        .replace(
                            /^#/,
                            ''
                        );

                if (!idValue) {
                    throw new Error(
                        'ID locator requires a value.'
                    );
                }

                return page.locator(
                    `[id=${JSON.stringify(
                        idValue
                    )}]`
                );
            }

            /*
             * Excel format:
             *
             * Locator Type: css
             * Locator Value: button[type="submit"]
             */
            case 'css': {

                if (
                    !locatorDef.value.trim()
                ) {
                    throw new Error(
                        'CSS locator requires a value.'
                    );
                }

                return page.locator(
                    locatorDef.value
                );
            }

            /*
             * Excel format:
             *
             * Locator Type: xpath
             * Locator Value: //button[@type="submit"]
             */
            case 'xpath': {

                if (
                    !locatorDef.value.trim()
                ) {
                    throw new Error(
                        'XPath locator requires a value.'
                    );
                }

                return page.locator(
                    locatorDef.value
                );
            }

            /*
             * Kept for compatibility with older testcases.
             */
            case 'text':

                return page.getByText(
                    locatorDef.value,
                    {
                        exact:
                            locatorDef.exact
                    }
                );

            case 'label':

                return page.getByLabel(
                    locatorDef.value,
                    {
                        exact:
                            locatorDef.exact
                    }
                );

            case 'placeholder':

                return page.getByPlaceholder(
                    locatorDef.value,
                    {
                        exact:
                            locatorDef.exact
                    }
                );

            case 'testId':

                return page.getByTestId(
                    locatorDef.value
                );

            default:

                throw new Error(
                    `Unsupported locator type: ${locatorDef.type}`
                );
        }
    }
}