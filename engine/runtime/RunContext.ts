import * as fs from 'fs';
import * as path from 'path';

export interface RunContextData {
    runId: string;
    runDirectory: string;
    screenshotsDirectory: string;
    recordingsDirectory: string;
    resultFile: string;
    reportFile: string;
}

export class RunContext {

    static create(): RunContextData {

        const now = new Date();

        const timestamp = now
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}Z$/, '')
            .replace('T', '_');

        const runId = `RUN_${timestamp}`;

        const runDirectory = path.join(
            process.cwd(),
            'executions',
            runId
        );

        const screenshotsDirectory = path.join(
            runDirectory,
            'screenshots'
        );

        const recordingsDirectory = path.join(
            runDirectory,
            'recordings'
        );

        fs.mkdirSync(
            screenshotsDirectory,
            { recursive: true }
        );

        fs.mkdirSync(
            recordingsDirectory,
            { recursive: true }
        );

        return {
            runId,
            runDirectory,
            screenshotsDirectory,
            recordingsDirectory,

            resultFile: path.join(
                runDirectory,
                'result.json'
            ),

            reportFile: path.join(
                runDirectory,
                'index.html'
            )
        };
    }
}