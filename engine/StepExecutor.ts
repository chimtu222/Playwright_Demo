import {
    Page,
    expect
} from '@playwright/test';

import {
    TestStep
} from './types';

import {
    LocatorFactory
} from './utils/LocatorFactory';

import {
    ScreenshotManager
} from './utils/ScreenshotManager';

export interface StepExecutionOutput {
    screenshot?: string;
}

export class StepExecutor {

    static async executeStep(
        page: Page,
        step: TestStep,
        testCaseId: string,
        screenshotsDirectory: string
    ): Promise<StepExecutionOutput> {

        switch (step.action) {

            case 'navigate': {

                if (!step.value) {
                    throw new Error(
                        `${step.id}: Navigate URL is missing.`
                    );
                }

                await page.goto(
                    step.value,
                    {
                        waitUntil:
                            'domcontentloaded',

                        timeout:
                            step.timeout ??
                            30000
                    }
                );

                break;
            }

            case 'fill': {

                if (!step.locator) {
                    throw new Error(
                        `${step.id}: Fill locator is missing.`
                    );
                }

                const fillLocator =
                    LocatorFactory.getLocator(
                        page,
                        step.locator
                    );

                await fillLocator.fill(
                    step.value ?? '',
                    {
                        timeout:
                            step.timeout ??
                            15000
                    }
                );

                break;
            }

            case 'click': {

                if (!step.locator) {
                    throw new Error(
                        `${step.id}: Click locator is missing.`
                    );
                }

                const clickLocator =
                    LocatorFactory.getLocator(
                        page,
                        step.locator
                    );

                await clickLocator.click({
                    timeout:
                        step.timeout ??
                        15000
                });

                break;
            }

            case 'scroll': {

                const scrollAmount =
                    Number(
                        step.value
                    );

                if (
                    Number.isNaN(
                        scrollAmount
                    )
                ) {
                    throw new Error(
                        `${step.id}: Invalid scroll Value "${step.value}".`
                    );
                }

                await page.evaluate(
                    amount => {
                        window.scrollBy(
                            0,
                            amount
                        );
                    },
                    scrollAmount
                );

                break;
            }

            case 'verifyVisible': {

                if (!step.locator) {
                    throw new Error(
                        `${step.id}: Verify locator is missing.`
                    );
                }

                await expect(
                    LocatorFactory.getLocator(
                        page,
                        step.locator
                    )
                ).toBeVisible({
                    timeout:
                        step.timeout ??
                        15000
                });

                break;
            }

            case 'verifyText': {

                if (!step.locator) {
                    throw new Error(
                        `${step.id}: Verify Text locator is missing.`
                    );
                }

                if (
                    step.expectedValue ===
                    undefined
                ) {
                    throw new Error(
                        `${step.id}: Expected text is missing.`
                    );
                }

                await expect(
                    LocatorFactory.getLocator(
                        page,
                        step.locator
                    )
                ).toContainText(
                    step.expectedValue,
                    {
                        timeout:
                            step.timeout ??
                            15000
                    }
                );

                break;
            }

            case 'verifyUrl': {

                if (!step.expectedValue) {
                    throw new Error(
                        `${step.id}: Expected URL is missing.`
                    );
                }

                await expect(
                    page
                ).toHaveURL(
                    new RegExp(
                        this.escapeRegExp(
                            step.expectedValue
                        ),
                        'i'
                    ),
                    {
                        timeout:
                            step.timeout ??
                            15000
                    }
                );

                break;
            }

            case 'selectOption': {

                if (!step.locator) {
                    throw new Error(
                        `${step.id}: Select Option locator is missing.`
                    );
                }

                if (
                    step.value ===
                    undefined
                ) {
                    throw new Error(
                        `${step.id}: Select Option Value is missing.`
                    );
                }

                const selectLocator =
                    LocatorFactory.getLocator(
                        page,
                        step.locator
                    );

                await selectLocator.selectOption(
                    step.value,
                    {
                        timeout:
                            step.timeout ??
                            15000
                    }
                );

                break;
            }

            default:

                throw new Error(
                    `Unsupported action: ${step.action}`
                );
        }

        let screenshot:
            string | undefined;

        if (
            step.captureScreenshot
        ) {
            screenshot =
                await ScreenshotManager.capture(
                    page,
                    screenshotsDirectory,
                    `${testCaseId}_${step.id}_${step.name}`
                );
        }

        return {
            screenshot
        };
    }

    private static escapeRegExp(
        value: string
    ): string {

        return value.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        );
    }
}