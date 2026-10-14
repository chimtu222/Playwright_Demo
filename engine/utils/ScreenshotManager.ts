import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotManager {

    static async capture(
        page: Page,
        screenshotsDirectory: string,
        fileName: string
    ): Promise<string> {

        fs.mkdirSync(
            screenshotsDirectory,
            { recursive: true }
        );

        const safeFileName = fileName
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_');

        const fullPath = path.join(
            screenshotsDirectory,
            `${safeFileName}.png`
        );

        await page.screenshot({
            path: fullPath,
            fullPage: true
        });

        // This relative path will be used inside index.html.
        return `screenshots/${safeFileName}.png`;
    }
}