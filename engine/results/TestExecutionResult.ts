export type ExecutionStatus =
    | 'Passed'
    | 'Failed'
    | 'Skipped';

export interface StepResult {
    stepId: string;
    stepName: string;
    action: string;
    status: ExecutionStatus;
    startTime: string;
    endTime: string;
    duration: number;
    screenshot?: string;
    error?: string;
}

export interface TestCaseResult {
    testCaseId: string;
    testCaseName: string;
    description?: string;
    module?: string;
    priority?: string;
    status: ExecutionStatus;
    startTime: string;
    endTime: string;
    duration: number;
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    steps: StepResult[];
    recording?: string;
}

export interface ExecutionResult {
    executionId: string;
    status: ExecutionStatus;
    environment: string;
    browser: string;
    startTime: string;
    endTime: string;
    duration: number;
    totalTestCases: number;
    passedTestCases: number;
    failedTestCases: number;
    testCases: TestCaseResult[];
}