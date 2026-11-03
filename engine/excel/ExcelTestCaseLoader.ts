import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { performance } from 'node:perf_hooks';

import {
    ActionType,
    CodelessTestCase,
    LocatorType,
    TestStep
} from '../types';

interface TestCaseControlRow {
    testCaseId: string;
    testCaseName: string;
    runStatus: string;
    module: string;

    priority?:
        | 'Low'
        | 'Medium'
        | 'High'
        | 'Critical';
}

export class ExcelTestCaseLoader {

    private static readonly workbookPath =
        path.join(
            process.cwd(),
            'testdata',
            'PlaywrightTestData.xlsx'
        );

    static async loadEnabledTestCases():
        Promise<CodelessTestCase[]> {

        /*
         * Measures the complete loader execution,
         * including Excel reading and object conversion.
         */
        const totalLoaderStart =
            performance.now();

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

        /*
         * Measure only the time taken by ExcelJS
         * to open, unzip, and parse the workbook.
         */
        const excelReadStart =
            performance.now();

        await workbook.xlsx.readFile(
            this.workbookPath,
            {
                ignoreNodes: [
                    'dataValidations',
                    'conditionalFormatting',
                    'hyperlinks',
                    'pageMargins',
                    'pageSetup',
                    'headerFooter',
                    'printOptions',
                    'drawing',
                    'picture',
                    'tableParts',
                    'autoFilter',
                    'mergeCells'
                ]
            }
        );

        const excelReadEnd =
            performance.now();

        const excelReadTime =
            excelReadEnd -
            excelReadStart;

        /*
         * Object-conversion timing starts only after
         * ExcelJS has finished reading the workbook.
         */
        const conversionStart =
            performance.now();

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

        /*
         * This map is used for validating reusable
         * testcase references such as TC001.
         */
        const controlMap =
            new Map<
                string,
                TestCaseControlRow
            >();

        for (
            const controlRow
            of controlRows
        ) {
            const normalizedId =
                controlRow.testCaseId
                    .trim()
                    .toUpperCase();

            if (
                controlMap.has(
                    normalizedId
                )
            ) {
                throw new Error(
                    `Duplicate TCID "${controlRow.testCaseId}" ` +
                    `was found in the TestCases sheet.`
                );
            }

            controlMap.set(
                normalizedId,
                controlRow
            );
        }

        /*
         * Top-level execution is controlled from
         * the TestCases sheet.
         */
        const enabledRows =
            controlRows.filter(
                row =>
                    row.runStatus === 'Y'
            );

        if (
            enabledRows.length === 0
        ) {
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
            const testCaseId =
                controlRow.testCaseId
                    .trim()
                    .toUpperCase();

            const testCaseSheet =
                this.getWorksheetByName(
                    workbook,
                    testCaseId
                );

            if (!testCaseSheet) {
                throw new Error(
                    `Worksheet "${testCaseId}" was not found ` +
                    `for testcase "${controlRow.testCaseName}".`
                );
            }

            const steps =
                this.readTestSteps(
                    workbook,
                    controlMap,
                    testCaseSheet,
                    testCaseId,
                    []
                );

            if (
                steps.length === 0
            ) {
                throw new Error(
                    `No enabled steps were found in worksheet "${testCaseId}".`
                );
            }

            testCases.push({
                id:
                    testCaseId,

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

        const conversionEnd =
            performance.now();

        const conversionTime =
            conversionEnd -
            conversionStart;

        /*
         * Keep sorting separate so that it does not
         * incorrectly appear as Excel conversion time.
         */
        const sortingStart =
            performance.now();

        const sortedTestCases =
            testCases.sort(
                (first, second) =>
                    first.id.localeCompare(
                        second.id
                    )
            );

        const sortingEnd =
            performance.now();

        const sortingTime =
            sortingEnd -
            sortingStart;

        const totalLoaderEnd =
            performance.now();

        const totalLoaderTime =
            totalLoaderEnd -
            totalLoaderStart;

        const totalSteps =
            sortedTestCases.reduce(
                (
                    total,
                    testCase
                ) =>
                    total +
                    testCase.steps.length,
                0
            );

        console.log('');
        console.log(
            '================ EXCEL LOADING PERFORMANCE ================'
        );

        console.log(
            `Workbook file size : ${this.formatFileSize(
                fs.statSync(
                    this.workbookPath
                ).size
            )}`
        );

        console.log(
            `Workbook sheets    : ${workbook.worksheets.length}`
        );

        console.log(
            `Testcases loaded   : ${sortedTestCases.length}`
        );

        console.log(
            `Steps loaded       : ${totalSteps}`
        );

        console.log(
            `Excel read time    : ${excelReadTime.toFixed(2)} ms`
        );

        console.log(
            `Object conversion  : ${conversionTime.toFixed(2)} ms`
        );

        console.log(
            `Sorting time       : ${sortingTime.toFixed(2)} ms`
        );

        console.log(
            `Total loader time  : ${totalLoaderTime.toFixed(2)} ms`
        );

        console.log(
            `Total loader time  : ${(totalLoaderTime / 1000).toFixed(3)} sec`
        );

        console.log(
            '==========================================================='
        );

        console.log('');

        return sortedTestCases;
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
                )
                    .trim()
                    .toUpperCase();

            const testCaseName =
                this.getCellText(
                    row.getCell(2)
                );

            const runStatus =
                this.getCellText(
                    row.getCell(3)
                )
                    .trim()
                    .toUpperCase();

            const module =
                this.getCellText(
                    row.getCell(4)
                );

            const priorityText =
                this.getCellText(
                    row.getCell(5)
                );

            const isBlankRow =
                !testCaseId &&
                !testCaseName &&
                !runStatus &&
                !module &&
                !priorityText;

            if (isBlankRow) {
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
        workbook: ExcelJS.Workbook,
        controlMap: Map<
            string,
            TestCaseControlRow
        >,
        worksheet: ExcelJS.Worksheet,
        testCaseId: string,
        callStack: string[]
    ): TestStep[] {

        const normalizedTestCaseId =
            testCaseId
                .trim()
                .toUpperCase();

        /*
         * Prevent circular calls:
         *
         * TC001 -> TC003 -> TC001
         */
        if (
            callStack.includes(
                normalizedTestCaseId
            )
        ) {
            const circularChain = [
                ...callStack,
                normalizedTestCaseId
            ].join(' -> ');

            throw new Error(
                `Circular testcase reference detected: ${circularChain}`
            );
        }

        const currentCallStack = [
            ...callStack,
            normalizedTestCaseId
        ];

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

            /*
             * Excel column structure:
             *
             * 1 = Step No.
             * 2 = Step Name
             * 3 = Action
             * 4 = Locator Type
             * 5 = Locator Value
             * 6 = URL
             * 7 = Value
             * 8 = Run Status / Referenced TCID
             */

            const stepName =
                this.getCellText(
                    row.getCell(2)
                );

            const excelAction =
                this.getCellText(
                    row.getCell(3)
                );

            const locatorType =
                this.getCellText(
                    row.getCell(4)
                );

            const locatorValue =
                this.getCellText(
                    row.getCell(5)
                );

            const url =
                this.getCellText(
                    row.getCell(6)
                );

            const value =
                this.getCellText(
                    row.getCell(7)
                );

            const runDirective =
                this.getCellText(
                    row.getCell(8)
                )
                    .trim()
                    .toUpperCase();

            /*
             * Step No. is intentionally ignored.
             *
             * The first row where all actual execution
             * columns are blank marks the end of the testcase.
             */
            const isCompletelyBlankRow =
                !stepName &&
                !excelAction &&
                !locatorType &&
                !locatorValue &&
                !url &&
                !value &&
                !runDirective;

            if (
                isCompletelyBlankRow
            ) {
                break;
            }

            if (!runDirective) {
                throw new Error(
                    `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                    `Run Status is required. Use Y, N, or a valid TCID.`
                );
            }

            /*
             * N means skip the row.
             */
            if (
                runDirective === 'N'
            ) {
                continue;
            }

            /*
             * A value other than Y or N is treated
             * as a reusable testcase reference.
             */
            if (
                runDirective !== 'Y'
            ) {
                const referencedTestCaseId =
                    runDirective;

                if (
                    excelAction ||
                    locatorType ||
                    locatorValue ||
                    url ||
                    value
                ) {
                    throw new Error(
                        `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                        `Referenced testcase row "${referencedTestCaseId}" ` +
                        `must not contain Action, Locator Type, ` +
                        `Locator Value, URL, or Value.`
                    );
                }

                if (!stepName) {
                    throw new Error(
                        `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                        `Step Name is required for testcase reference ` +
                        `"${referencedTestCaseId}".`
                    );
                }

                if (
                    !controlMap.has(
                        referencedTestCaseId
                    )
                ) {
                    throw new Error(
                        `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                        `Referenced testcase "${referencedTestCaseId}" ` +
                        `was not found in the TestCases sheet.`
                    );
                }

                const referencedSheet =
                    this.getWorksheetByName(
                        workbook,
                        referencedTestCaseId
                    );

                if (!referencedSheet) {
                    throw new Error(
                        `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                        `Worksheet "${referencedTestCaseId}" was not found.`
                    );
                }

                const referencedSteps =
                    this.readTestSteps(
                        workbook,
                        controlMap,
                        referencedSheet,
                        referencedTestCaseId,
                        currentCallStack
                    );

                if (
                    referencedSteps.length === 0
                ) {
                    throw new Error(
                        `${normalizedTestCaseId}, Excel row ${rowNumber}: ` +
                        `Referenced testcase "${referencedTestCaseId}" ` +
                        `does not contain any enabled steps.`
                    );
                }

                /*
                 * Insert referenced testcase steps into
                 * the parent testcase sequence.
                 */
                for (
                    const referencedStep
                    of referencedSteps
                ) {
                    const generatedStepId =
                        this.createStepId(
                            steps.length + 1
                        );

                    steps.push({
                        ...referencedStep,

                        id:
                            generatedStepId,

                        name:
                            `${stepName} › ` +
                            `[${referencedTestCaseId}] ` +
                            `${referencedStep.name}`
                    });
                }

                /*
                 * Continue with the next row
                 * from the parent testcase.
                 */
                continue;
            }

            /*
             * Y means this is a normal executable step.
             */
            const action =
                this.normalizeAction(
                    excelAction,
                    normalizedTestCaseId,
                    rowNumber
                );

            this.validateStep(
                normalizedTestCaseId,
                rowNumber,
                stepName,
                action,
                locatorType,
                locatorValue,
                url,
                value
            );

            const stepId =
                this.createStepId(
                    steps.length + 1
                );

            const step:
                TestStep = {

                id:
                    stepId,

                name:
                    stepName,

                action,

                captureScreenshot:
                    true
            };

            switch (action) {

                case 'navigate': {

                    step.value =
                        url;

                    break;
                }

                case 'scroll': {

                    step.value =
                        value;

                    break;
                }

                case 'verifyUrl': {

                    step.expectedValue =
                        url || value;

                    break;
                }

                case 'fill': {

                    step.locator =
                        this.createLocatorDefinition(
                            locatorType,
                            locatorValue,
                            normalizedTestCaseId,
                            rowNumber
                        );

                    step.value =
                        value;

                    break;
                }

                case 'verifyText': {

                    step.locator =
                        this.createLocatorDefinition(
                            locatorType,
                            locatorValue,
                            normalizedTestCaseId,
                            rowNumber
                        );

                    step.expectedValue =
                        value;

                    break;
                }

                case 'selectOption': {

                    step.locator =
                        this.createLocatorDefinition(
                            locatorType,
                            locatorValue,
                            normalizedTestCaseId,
                            rowNumber
                        );

                    step.value =
                        value;

                    break;
                }

                default: {

                    step.locator =
                        this.createLocatorDefinition(
                            locatorType,
                            locatorValue,
                            normalizedTestCaseId,
                            rowNumber
                        );

                    break;
                }
            }

            steps.push(
                step
            );
        }

        return steps;
    }

    private static createLocatorDefinition(
        locatorType: string,
        locatorValue: string,
        testCaseId: string,
        rowNumber: number
    ) {

        return {
            type:
                this.normalizeLocatorType(
                    locatorType,
                    testCaseId,
                    rowNumber
                ),

            value:
                locatorValue
        };
    }

    private static createStepId(
        stepNumber: number
    ): string {

        return `STEP${String(
            stepNumber
        ).padStart(3, '0')}`;
    }

    private static getWorksheetByName(
        workbook: ExcelJS.Workbook,
        worksheetName: string
    ): ExcelJS.Worksheet | undefined {

        const normalizedName =
            worksheetName
                .trim()
                .toUpperCase();

        return workbook.worksheets.find(
            worksheet =>
                worksheet.name
                    .trim()
                    .toUpperCase() ===
                normalizedName
        );
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

            navigate:
                'navigate',

            click:
                'click',

            scroll:
                'scroll',

            verify:
                'verifyVisible',

            verifyvisible:
                'verifyVisible',

            'verify visible':
                'verifyVisible',

            fill:
                'fill',

            'verify text':
                'verifyText',

            verifytext:
                'verifyText',

            verifyurl:
                'verifyUrl',

            'verify url':
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

    private static normalizeLocatorType(
        excelLocatorType: string,
        testCaseId: string,
        rowNumber: number
    ): LocatorType {

        const normalized =
            excelLocatorType
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ');

        const locatorMap:
            Record<string, LocatorType> = {

            role:
                'role',

            id:
                'id',

            css:
                'css',

            xpath:
                'xpath'
        };

        const locatorType =
            locatorMap[normalized];

        if (!locatorType) {
            throw new Error(
                `${testCaseId}, Excel row ${rowNumber}: ` +
                `Unsupported Locator Type "${excelLocatorType}". ` +
                `Supported values are role, id, css, and xpath.`
            );
        }

        return locatorType;
    }

    private static validateStep(
        testCaseId: string,
        rowNumber: number,
        stepName: string,
        action: ActionType,
        locatorType: string,
        locatorValue: string,
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

        /*
         * Navigate uses URL and does not need a locator.
         */
        if (
            action === 'navigate' &&
            !url
        ) {
            throw new Error(
                `${location}: navigate requires URL.`
            );
        }

        /*
         * Scroll uses Value as the vertical scroll amount.
         */
        if (
            action === 'scroll' &&
            !value
        ) {
            throw new Error(
                `${location}: scroll requires Value.`
            );
        }

        /*
         * Verify URL accepts the expected address
         * from URL or Value.
         */
        if (
            action === 'verifyUrl' &&
            !url &&
            !value
        ) {
            throw new Error(
                `${location}: verifyurl requires URL or Value.`
            );
        }

        const locatorRequiredActions:
            ActionType[] = [
                'click',
                'fill',
                'verifyVisible',
                'verifyText',
                'selectOption'
            ];

        if (
            locatorRequiredActions.includes(
                action
            )
        ) {
            if (!locatorType) {
                throw new Error(
                    `${location}: ${action} requires Locator Type.`
                );
            }

            if (!locatorValue) {
                throw new Error(
                    `${location}: ${action} requires Locator Value.`
                );
            }

            /*
             * Validate Locator Type while loading Excel.
             */
            this.normalizeLocatorType(
                locatorType,
                testCaseId,
                rowNumber
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

    private static formatFileSize(
        sizeInBytes: number
    ): string {

        if (
            sizeInBytes <
            1024
        ) {
            return `${sizeInBytes} bytes`;
        }

        const sizeInKilobytes =
            sizeInBytes /
            1024;

        if (
            sizeInKilobytes <
            1024
        ) {
            return `${sizeInKilobytes.toFixed(2)} KB`;
        }

        const sizeInMegabytes =
            sizeInKilobytes /
            1024;

        return `${sizeInMegabytes.toFixed(2)} MB`;
    }
}