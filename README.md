# Playwright_Demo

Playwright_Demo is an Excel-driven, codeless UI automation framework built using Playwright and TypeScript. Users can select testcases and define test steps directly in Excel without writing automation code.

## Prerequisites

Install the following before setting up the framework:

- Node.js LTS
- Visual Studio Code
- Microsoft Excel

## Setup Instructions

### 1. Extract the ZIP File

Extract the ZIP file to a local folder.

Example:

text
C:\Automation\Playwright_Demo


### 2. Open the Project

Open the extracted `Playwright_Demo` folder in Visual Studio Code.

Open a new terminal and navigate to the project:


cd C:\Automation\Playwright_Demo


The terminal must be opened in the folder containing `package.json`.

### 3. Check Node.js and npm


node --version

npm --version


Both commands should display installed version numbers.

### 4. Install Project Dependencies

If `package-lock.json` is included, run:


npm ci

Otherwise, run:

npm install


This installs the required packages, including Playwright, TypeScript dependencies, and ExcelJS.

### 5. Install the Playwright Browser


npx playwright install chromium


### 6. Verify Playwright


npx playwright --version


### 7. Check the Excel Test Data

Make sure the Excel file is available at:

text
testdata\PlaywrightTestData.xlsx


In the `TestCases` sheet:

- Set `Run Status` to `Y` to execute a testcase.
- Set `Run Status` to `N` to skip a testcase.
- Each enabled TCID must have a worksheet with the same name.

Example:

text
TC001 → TC001 worksheet
TC002 → TC002 worksheet


## Run the Framework

### Live UI Mode

Use this mode to run and inspect the test through Playwright UI:


npx playwright test tests/runner.spec.ts --ui


Select the test in the UI and click the Run button.

### Visible Browser Mode

Use this mode to watch the browser execute the Excel test steps:


npx playwright test tests/runner.spec.ts --headed


### Headless Mode

Use this mode for faster execution without opening browser windows:


npx playwright test tests/runner.spec.ts


## Reports

### Custom Execution Report

After execution, open the `index.html` file from the latest run folder:

text
executions\<latest RUN folder>\index.html


### Default Playwright Report


npx playwright show-report


## Common Fix

If the browser executable is missing, run:


npx playwright install chromium
