export type ActionType =
    | 'navigate'
    | 'click'
    | 'scroll'
    | 'fill'
    | 'verifyVisible'
    | 'verifyText'
    | 'verifyUrl'
    | 'selectOption'
    | 'check'
    | 'uncheck'
    | 'switchToNewTab'
    | 'switchToTab'
    | 'closeCurrentTab'
    | 'switchToMainTab'
    | 'waitForElement'
    | 'uploadFile'
    | 'takeScreenshot';

export type LocatorType =
    | 'role'
    | 'text'
    | 'label'
    | 'placeholder'
    | 'testId'
    | 'css'
    | 'xpath';

export interface LocatorDefinition {
    type: LocatorType;
    value: string;
    name?: string;
    exact?: boolean;
}

export interface TestStep {
    id: string;
    name: string;
    action: ActionType;
    locator?: LocatorDefinition;
    value?: string;
    expectedValue?: string;
    timeout?: number;
    captureScreenshot?: boolean;
    sensitive?: boolean;
}

export interface CodelessTestCase {
    id: string;
    name: string;
    description?: string;
    module?: string;
    priority?:
        | 'Low'
        | 'Medium'
        | 'High'
        | 'Critical';
    tags?: string[];
    environment: string;
    enabled: boolean;
    steps: TestStep[];
}

export interface EnvironmentConfig {
    id: string;
    name: string;
    baseUrl: string;
    defaultBrowser:
        | 'chromium'
        | 'firefox'
        | 'webkit';
    headless: boolean;
    defaultTimeout: number;
    navigationTimeout: number;
}