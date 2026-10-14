import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

import {
    ActionType,
    CodelessTestCase,
    TestStep
} from '../types';

interface TestCaseControlRow {
    testCaseId: string;
    testCaseName: string;
    runStatus: string;
    module: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export class ExcelTestCaseLoader {

    private static readonly workbookPath =path.join(process.cwd(),'testdata','PlaywrightTestData.xlsx');

    static async loadEnabledTestCases():
        Promise<CodelessTestCase[]> {

        if (
            !fs.existsSync(
                this.workbookPath
            )
        ) {
            throw new Error(
                `PlayFlow workbook was not found: ${this.workbookPath}`
            );
        }

        const workbook =
            new ExcelJS.Workbook();

        await workbook.xlsx.readFile(
            this.workbookPath
        );

        const controlSheet =
            workbook.getWorksheet(
                'TestCases'
            );

        if (!controlSheet) {
            throw new Error(
                'Required Excel sheet "TestCases" was not found.'
            );
        }

        const controlRows =
            this.readControlRows(
                controlSheet
            );

        const enabledRows =
            controlRows.filter(
                row =>
                    row.runStatus === 'Y'
            );

        if (enabledRows.length === 0) {
            throw new Error(
                'No testcases have Run Status = Y in the TestCases sheet.'
            );
        }

        const testCases:
            CodelessTestCase[] = [];

        for (
            const controlRow
            of enabledRows
        ) {
            const testCaseSheet =
                workbook.getWorksheet(
                    controlRow.testCaseId
                );

            if (!testCaseSheet) {
                throw new Error(
                    `Worksheet "${controlRow.testCaseId}" was not found ` +
                    `for testcase "${controlRow.testCaseName}".`
                );
            }

            const steps =
                this.readTestSteps(
                    testCaseSheet,
                    controlRow.testCaseId
                );

            testCases.push({
                id:
                    controlRow.testCaseId,

                name:
                    controlRow.testCaseName,

                description:
                    controlRow.testCaseName,

                module:
                    controlRow.module ||
                    'Not specified',

                priority:
                    controlRow.priority,

                environment:
                    'Excel',

                enabled:
                    true,

                steps
            });
        }

        return testCases.sort(
            (first, second) =>
                first.id.localeCompare(
                    second.id
                )
        );
    }

    private static readControlRows(
        worksheet: ExcelJS.Worksheet
    ): TestCaseControlRow[] {

        const rows:
            TestCaseControlRow[] = [];

        for (
            let rowNumber = 5;
            rowNumber <= worksheet.rowCount;
            rowNumber++
        ) {
            const row =
                worksheet.getRow(
                    rowNumber
                );

            const testCaseId =
                this.getCellText(
                    row.getCell(1)
                );

            const testCaseName =
                this.getCellText(
                    row.getCell(2)
                );

            const runStatus =
                this.getCellText(
                    row.getCell(3)
                ).toUpperCase();

            const module =
                this.getCellText(
                    row.getCell(4)
                );

            const priorityText =
                this.getCellText(
                    row.getCell(5)
                );

            if (
                !testCaseId &&
                !testCaseName &&
                !runStatus &&
                !module &&
                !priorityText
            ) {
                continue;
            }

            if (!testCaseId) {
                throw new Error(
                    `TestCases sheet row ${rowNumber}: TCID is required.`
                );
            }

            if (!testCaseName) {
                throw new Error(
                    `TestCases sheet row ${rowNumber}: ` +
                    `Test Case Name is required for ${testCaseId}.`
                );
            }

            if (
                runStatus !== 'Y' &&
                runStatus !== 'N'
            ) {
                throw new Error(
                    `TestCases sheet row ${rowNumber}: ` +
                    `Run Status must be Y or N for ${testCaseId}.`
                );
            }

            const allowedPriorities = [
                '',
                'Low',
                'Medium',
                'High',
                'Critical'
            ];

            if (
                !allowedPriorities.includes(
                    priorityText
                )
            ) {
                throw new Error(
                    `TestCases sheet row ${rowNumber}: ` +
                    `Invalid priority "${priorityText}".`
                );
            }

            rows.push({
                testCaseId,
                testCaseName,
                runStatus,
                module,
                priority:
                    priorityText
                        ? priorityText as
                            | 'Low'
                            | 'Medium'
                            | 'High'
                            | 'Critical'
                        : undefined
            });
        }

        return rows;
    }

    private static readTestSteps(
        worksheet: ExcelJS.Worksheet,
        testCaseId: string
    ): TestStep[] {

        const steps:
            TestStep[] = [];

        for (
            let rowNumber = 5;
            rowNumber <= worksheet.rowCount;
            rowNumber++
        ) {
            const row =
                worksheet.getRow(
                    rowNumber
                );

            const stepName =
                this.getCellText(
                    row.getCell(2)
                );

            const excelAction =
                this.getCellText(
                    row.getCell(3)
                );

            const xpath =
                this.getCellText(
                    row.getCell(4)
                );

            const url =
                this.getCellText(
                    row.getCell(5)
                );

            const value =
                this.getCellText(
                    row.getCell(6)
                );

            if (
                !stepName &&
                !excelAction &&
                !xpath &&
                !url &&
                !value
            ) {
                continue;
            }

            const action =
                this.normalizeAction(
                    excelAction,
                    testCaseId,
                    rowNumber
                );

            this.validateStep(
                testCaseId,
                rowNumber,
                stepName,
                action,
                xpath,
                url,
                value
            );

            const stepId =
                `STEP${String(
                    steps.length + 1
                ).padStart(3, '0')}`;

            const step:
                TestStep = {
                id:stepId,
                name:stepName,
                action,
                captureScreenshot:true
            };

            switch (action) {

                case 'navigate':
                    step.value =url;
                    break;

                case 'scroll':
                    step.value =value;
                    break;

                case 'verifyUrl':

                    /*
                     * For verifyurl, the user can enter the expected
                     * address in URL. Value is also supported.
                     */
                    step.expectedValue =url || value;
                    break;

                case 'fill':

                    step.locator = {
                        type: 'xpath',
                        value: xpath
                    };

                    step.value =value;
                    break;

                case 'verifyText':

                    step.locator = {
                        type: 'xpath',
                        value: xpath
                    };

                    step.expectedValue =
                        value;
                    break;

                case 'selectOption':

                    step.locator = {
                        type: 'xpath',
                        value: xpath
                    };

                    step.value =
                        value;

                    break;

                default:

                    step.locator = {
                        type: 'xpath',
                        value: xpath
                    };

                    break;
            }

            steps.push(
                step
            );
        }

        if (steps.length === 0) {
            throw new Error(
                `No executable steps were found in worksheet "${testCaseId}".`
            );
        }

        return steps;
    }

    private static normalizeAction(
        excelAction: string,
        testCaseId: string,
        rowNumber: number
    ): ActionType {

        const normalized =
            excelAction
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ');

        const actionMap:
            Record<string, ActionType> = {

            navigate:'navigate',
            click:'click',
            scroll: 'scroll',
            verify:'verifyVisible',
            /*
             * Backward compatibility for the sample data currently
             * present in the workbook.
             */
            verifyvisible:'verifyVisible',

            fill:'fill',

            'verify text':
                'verifyText',

            verifytext:
                'verifyText',

            verifyurl:
                'verifyUrl',

            'select option':
                'selectOption',

            selectoption:
                'selectOption'
        };

        const action =
            actionMap[normalized];

        if (!action) {
            throw new Error(
                `${testCaseId}, Excel row ${rowNumber}: ` +
                `Unsupported action "${excelAction}".`
            );
        }

        return action;
    }

    private static validateStep(
        testCaseId: string,
        rowNumber: number,
        stepName: string,
        action: ActionType,
        xpath: string,
        url: string,
        value: string
    ): void {

        const location =
            `${testCaseId}, Excel row ${rowNumber}`;

        if (!stepName) {
            throw new Error(
                `${location}: Step Name is required.`
            );
        }

        if (
            action === 'navigate' &&
            !url
        ) {
            throw new Error(
                `${location}: navigate requires URL.`
            );
        }

        if (
            action === 'scroll' &&
            !value
        ) {
            throw new Error(
                `${location}: scroll requires Value.`
            );
        }

        if (
            action === 'verifyUrl' &&
            !url &&
            !value
        ) {
            throw new Error(
                `${location}: verifyurl requires URL or Value.`
            );
        }

        const xpathRequiredActions:
            ActionType[] = [
                'click',
                'fill',
                'verifyVisible',
                'verifyText',
                'selectOption'
            ];

        if (
            xpathRequiredActions.includes(
                action
            ) &&
            !xpath
        ) {
            throw new Error(
                `${location}: ${action} requires XPath.`
            );
        }

        const valueRequiredActions:
            ActionType[] = [
                'fill',
                'verifyText',
                'selectOption'
            ];

        if (
            valueRequiredActions.includes(
                action
            ) &&
            !value
        ) {
            throw new Error(
                `${location}: ${action} requires Value.`
            );
        }
    }

    private static getCellText(
        cell: ExcelJS.Cell
    ): string {

        const value =
            cell.value;

        if (
            value === null ||
            value === undefined
        ) {
            return '';
        }

        if (
            typeof value === 'object'
        ) {
            if (
                'text' in value &&
                value.text !== undefined
            ) {
                return String(
                    value.text
                ).trim();
            }

            if (
                'result' in value &&
                value.result !== undefined
            ) {
                return String(
                    value.result
                ).trim();
            }

            if (
                'hyperlink' in value &&
                'text' in value
            ) {
                return String(
                    value.text
                ).trim();
            }
        }

        return String(
            value
        ).trim();
    }
}