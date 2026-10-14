import * as fs from 'fs';
import * as path from 'path';
import { ExecutionResult } from './TestExecutionResult';

export class ResultWriter {

    static save(
        result: ExecutionResult,
        resultFile: string
    ): void {

        fs.mkdirSync(
            path.dirname(resultFile),
            { recursive: true }
        );

        fs.writeFileSync(
            resultFile,
            JSON.stringify(
                result,
                null,
                4
            ),
            'utf-8'
        );
    }
}