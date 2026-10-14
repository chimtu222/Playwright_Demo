import {test,expect} from '@playwright/test';
import { TestRunner } from '../engine/TestRunner';
import { StepExecutor } from '../engine/StepExecutor';
import { RunContext } from '../engine/runtime/RunContext';
import { ResultWriter } from '../engine/results/ResultWriter';
import { HtmlReportGenerator } from '../engine/reports/HtmlReportGenerator';
const MAX_PARALLEL_TESTCASES = 5;

import {
    ExecutionResult,
    StepResult,
    TestCaseResult
} from '../engine/results/TestExecutionResult';

async function runWithConcurrency<TInput, TResult>(
    items: TInput[],
    concurrency: number,
    worker: (
        item: TInput,
        index: number
    ) => Promise<TResult>
): Promise<TResult[]> {

    const results =
        new Array<TResult>(
            items.length
        );

    let nextIndex = 0;

    async function executeWorker():
        Promise<void> {

        while (true) {

            const currentIndex =
                nextIndex++;

            if (
                currentIndex >=
                items.length
            ) {
                return;
            }

            results[currentIndex] =
                await worker(
                    items[currentIndex],
                    currentIndex
                );
        }
    }

    const workerCount =
        Math.min(
            concurrency,
            items.length
        );

    await Promise.all(
        Array.from(
            {
                length:
                    workerCount
            },
            () =>
                executeWorker()
        )
    );

    return results;
}
test(
    'Run enabled codeless testcases',
    async ({
    browser,
    browserName
}) => {

        test.setTimeout(900000);

        const runContext =RunContext.create();
        const executionStart =new Date();
        const testCases =await TestRunner.loadAllTestCases();
        console.log(
    `Found ${testCases.length} enabled test case(s).`
);

console.log(
    `Running with maximum ${MAX_PARALLEL_TESTCASES} parallel testcase(s).`
);

const testCaseResults =
    await runWithConcurrency(
        testCases,
        MAX_PARALLEL_TESTCASES,
        async tc => {

            console.log('');
            console.log('===================================');
            console.log(
                `Starting ${tc.id}: ${tc.name}`
            );
            console.log('===================================');

            /*
             * Each testcase receives a fresh page.
             * This prevents one testcase from affecting another.
             */
           const testContext = await browser.newContext();
           const page = await testContext.newPage();

            const testCaseStart =
                new Date();

            const stepResults:
                StepResult[] = [];

            let testCaseStatus:
                'Passed' | 'Failed' =
                'Passed';

            try {

                for (const originalStep of tc.steps) {

                    /*
                     * Create a copy so that resolving variables
                     * does not modify the original JSON object.
                     */
                    const step = {
                        ...originalStep,
                        locator:
                            originalStep.locator
                                ? {
                                    ...originalStep.locator
                                }
                                : undefined
                    };

                    const stepStart =
                        new Date();

                    console.log(
                        `Executing: ${tc.id} - ${step.name}`
                    );

                    try {
                        const output =
                            await StepExecutor.executeStep(
                                page,
                                step,
                                tc.id,
                                runContext.screenshotsDirectory
                            );

                        const stepEnd =
                            new Date();

                        stepResults.push({
                            stepId: step.id,
                            stepName: step.name,
                            action: step.action,
                            status: 'Passed',
                            startTime:
                                stepStart.toISOString(),
                            endTime:
                                stepEnd.toISOString(),
                            duration:
                                stepEnd.getTime() -
                                stepStart.getTime(),
                            screenshot:
                                output.screenshot
                        });

                        console.log(
                            `Passed: ${tc.id} - ${step.name}`
                        );
                    }
                    catch (error: any) {
                        
                        testCaseStatus =
                            'Failed';

                        const stepEnd =
                            new Date();
                        let failureScreenshot: string | undefined;

                        try {

                            const safeStepName =
                                step.name.replace(
                                    /[^a-zA-Z0-9_-]/g,
                                    '_'
                                );

                            const screenshotPath =
                                `${runContext.screenshotsDirectory}/${tc.id}_${step.id}_${safeStepName}_FAILED.png`;

                            await page.screenshot({
                                path: screenshotPath,
                                fullPage: true,
                                timeout: 10000
                            });

                            failureScreenshot =
                                `screenshots/${tc.id}_${step.id}_${safeStepName}_FAILED.png`;
                        }
                        catch {

                            console.error(
                                `Could not capture failure screenshot for ${tc.id} - ${step.id}`
                            );
                        }
                        stepResults.push({
                        stepId: step.id,
                        stepName: step.name,
                        action: step.action,
                        status: 'Failed',
                        startTime: stepStart.toISOString(),
                        endTime: stepEnd.toISOString(),
                        duration:
                            stepEnd.getTime() -
                            stepStart.getTime(),
                        screenshot: failureScreenshot,
                        error:
                            error?.message ??
                            String(error)
                    });

                        console.error(
                            `Failed: ${tc.id} - ${step.name}`
                        );
                        

                        /*
                         * Stop only the current testcase.
                         * The next testcase will still run.
                         */
                        break;
                    }
                }
            }
            finally {

                const testCaseEnd =
                    new Date();

                const passedSteps =
                    stepResults.filter(
                        step =>
                            step.status === 'Passed'
                    ).length;

                const failedSteps =
                    stepResults.filter(
                        step =>
                            step.status === 'Failed'
                    ).length;

              const testCaseResult:
                    TestCaseResult = {
                    testCaseId: tc.id,
                    testCaseName:tc.name,
                    description:tc.description,
                    module:tc.module,
                    priority:tc.priority,
                    status:testCaseStatus,
                    startTime:testCaseStart.toISOString(),
                    endTime:testCaseEnd.toISOString(),
                    duration:testCaseEnd.getTime() -testCaseStart.getTime(),
                    totalSteps: tc.steps.length,
                    passedSteps,
                    failedSteps,
                    steps:stepResults
                };

                await testContext.close();

                console.log(
                    `${tc.id} completed with status: ${testCaseStatus}`
                );
                return testCaseResult;
            }
        }        
    );

        const executionEnd =
            new Date();

        const passedTestCases =
            testCaseResults.filter(
                item =>
                    item.status === 'Passed'
            ).length;

        const failedTestCases =
            testCaseResults.filter(
                item =>
                    item.status === 'Failed'
            ).length;

        const executionStatus:
            'Passed' | 'Failed' =
            failedTestCases > 0
                ? 'Failed'
                : 'Passed';

        const result:
            ExecutionResult = {

            executionId:
                runContext.runId,

            status:
                executionStatus,

            environment:
                testCases[0]?.environment ??
                'Not specified',

            browser:
                browserName,

            startTime:
                executionStart.toISOString(),

            endTime:
                executionEnd.toISOString(),

            duration:
                executionEnd.getTime() -
                executionStart.getTime(),

            totalTestCases:
                testCaseResults.length,

            passedTestCases,

            failedTestCases,

            testCases:
                testCaseResults
        };

        ResultWriter.save(
            result,
            runContext.resultFile
        );

        HtmlReportGenerator.generate(
            result,
            runContext.reportFile
        );

        console.log('');
        console.log('===================================');
        console.log('Execution completed');
        console.log(
            `Total: ${result.totalTestCases}`
        );
        console.log(
            `Passed: ${result.passedTestCases}`
        );
        console.log(
            `Failed: ${result.failedTestCases}`
        );
        console.log(
            `Report: ${runContext.reportFile}`
        );
        console.log('===================================');

        
        if (failedTestCases > 0) {
            console.warn(
                `Execution completed with ${failedTestCases} failed codeless testcase(s).`
            );
        }
    }
);