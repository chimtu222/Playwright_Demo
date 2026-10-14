import {
    CodelessTestCase
} from './types';

import {
    ExcelTestCaseLoader
} from './excel/ExcelTestCaseLoader';

export class TestRunner {

    static async loadAllTestCases():
        Promise<CodelessTestCase[]> {

        return await ExcelTestCaseLoader
            .loadEnabledTestCases();
    }
}