import * as fs from 'fs';
import * as path from 'path';

import {
    ExecutionResult,
    TestCaseResult,
    StepResult
} from '../results/TestExecutionResult';

export class HtmlReportGenerator {

    static generate(
        result: ExecutionResult,
        reportFile: string
    ): void {

        fs.mkdirSync(
            path.dirname(reportFile),
            { recursive: true }
        );

        const testCaseCards = result.testCases
            .map((testCase, index) =>
                this.buildTestCaseCard(testCase, index)
            )
            .join('');

        const testCaseModals = result.testCases
            .map((testCase, index) =>
                this.buildTestCaseModal(testCase, index)
            )
            .join('');

        const html = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Playwright Report - ${this.escapeHtml(result.executionId)}
    </title>
    <link
        rel="icon"
        type="image/svg+xml"
        href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop stop-color='%232563eb'/%3E%3Cstop offset='1' stop-color='%237c3aed'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M18 16h17c9 0 15 5 15 13s-6 13-15 13h-7v8H18V16zm10 9v9h6c4 0 6-2 6-5s-2-4-6-4h-6z' fill='white'/%3E%3C/svg%3E"
    />
    <style>
        :root {
            --background-start: #eef3fb;
            --background-end: #f8fafc;

            --glass: rgba(255, 255, 255, 0.72);
            --glass-strong: rgba(255, 255, 255, 0.90);

            --border: rgba(148, 163, 184, 0.20);
            --border-strong: rgba(148, 163, 184, 0.32);

            --text-primary: #172033;
            --text-secondary: #64748b;
            --text-muted: #94a3b8;

            --blue: #3764e8;
            --blue-soft: rgba(55, 100, 232, 0.10);

            --green: #0f9f6e;
            --green-soft: rgba(15, 159, 110, 0.11);

            --red: #dc4c64;
            --red-soft: rgba(220, 76, 100, 0.10);

            --amber: #d28b24;
            --amber-soft: rgba(210, 139, 36, 0.12);

            --shadow:
                0 18px 55px
                rgba(15, 23, 42, 0.08);

            --shadow-soft:
                0 8px 30px
                rgba(15, 23, 42, 0.06);
        }

        * {
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            margin: 0;
            min-height: 100vh;

            color: var(--text-primary);

            font-family:
                Inter,
                "Segoe UI",
                -apple-system,
                BlinkMacSystemFont,
                Arial,
                sans-serif;

            font-size: 14px;

            background:
                radial-gradient(
                    circle at 12% 10%,
                    rgba(89, 126, 247, 0.15),
                    transparent 28%
                ),
                radial-gradient(
                    circle at 90% 14%,
                    rgba(113, 78, 210, 0.11),
                    transparent 25%
                ),
                linear-gradient(
                    145deg,
                    var(--background-start),
                    var(--background-end)
                );

            background-attachment: fixed;
        }

        body.modal-open {
            overflow: hidden;
        }

        button {
            font: inherit;
        }

        .page-shell {
            width: min(1320px, calc(100% - 36px));
            margin: 0 auto;
            padding: 32px 0 50px;
        }

        .glass-panel {
            background: var(--glass);
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            backdrop-filter: blur(22px);
            -webkit-backdrop-filter: blur(22px);
        }

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 22px;

            padding: 22px 24px;
            border-radius: 22px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .brand-mark {
            display: grid;
            place-items: center;

            width: 42px;
            height: 42px;

            color: white;
            font-size: 17px;
            font-weight: 700;

            background:
                linear-gradient(
                    135deg,
                    #4c6fff,
                    #7654d8
                );

            border-radius: 13px;

            box-shadow:
                0 10px 24px
                rgba(76, 111, 255, 0.25);
        }

        .brand-title {
            margin: 0;
            font-size: 17px;
            font-weight: 650;
            letter-spacing: -0.25px;
        }

        .brand-subtitle {
            margin: 4px 0 0;
            color: var(--text-secondary);
            font-size: 12px;
        }

        .overall-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;

            padding: 8px 13px;

            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.7px;
            text-transform: uppercase;

            border-radius: 999px;
        }

        .status-passed {
            color: var(--green);
            background: var(--green-soft);
            border: 1px solid rgba(15, 159, 110, 0.18);
        }

        .status-failed {
            color: var(--red);
            background: var(--red-soft);
            border: 1px solid rgba(220, 76, 100, 0.18);
        }

        .status-skipped {
            color: var(--amber);
            background: var(--amber-soft);
            border: 1px solid rgba(210, 139, 36, 0.18);
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: currentColor;
        }

        .execution-info {
            display: grid;
            grid-template-columns:
                minmax(0, 1.8fr)
                repeat(3, minmax(130px, 1fr));

            gap: 14px;
            margin-top: 18px;
        }

        .info-card {
            min-height: 104px;
            padding: 18px;

            background: rgba(255, 255, 255, 0.66);
            border: 1px solid var(--border);
            border-radius: 18px;

            box-shadow: var(--shadow-soft);
            backdrop-filter: blur(18px);
        }

        .info-card-primary {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .eyebrow {
            margin-bottom: 8px;

            color: var(--text-muted);

            font-size: 10px;
            font-weight: 750;
            letter-spacing: 1.1px;
            text-transform: uppercase;
        }

        .execution-id {
            margin: 0;

            font-size: 18px;
            font-weight: 650;
            letter-spacing: -0.3px;

            word-break: break-word;
        }

        .execution-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 7px 13px;

            margin-top: 10px;

            color: var(--text-secondary);
            font-size: 12px;
        }

        .metric-value {
            margin-top: 8px;

            font-size: 25px;
            font-weight: 620;
            letter-spacing: -0.6px;
        }

        .metric-passed {
            color: var(--green);
        }

        .metric-failed {
            color: var(--red);
        }

        .content-header {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 20px;

            margin: 30px 2px 14px;
        }

        .content-title {
            margin: 0;

            font-size: 17px;
            font-weight: 650;
            letter-spacing: -0.2px;
        }

        .content-description {
            margin: 5px 0 0;

            color: var(--text-secondary);
            font-size: 12px;
        }

        .testcase-count {
            color: var(--text-secondary);
            font-size: 12px;
        }

        .testcase-list {
            display: grid;
            gap: 11px;
        }

        .testcase-card {
            display: grid;
            grid-template-columns:
                48px
                minmax(0, 1fr)
                auto
                34px;

            align-items: center;
            gap: 15px;

            width: 100%;
            padding: 14px 16px;

            color: inherit;
            text-align: left;

            background: rgba(255, 255, 255, 0.72);
            border: 1px solid var(--border);
            border-radius: 16px;

            box-shadow: var(--shadow-soft);
            backdrop-filter: blur(18px);

            cursor: pointer;

            transition:
                transform 160ms ease,
                border-color 160ms ease,
                box-shadow 160ms ease,
                background 160ms ease;
        }

        .testcase-card:hover {
            transform: translateY(-2px);

            background: rgba(255, 255, 255, 0.92);
            border-color: rgba(55, 100, 232, 0.26);

            box-shadow:
                0 14px 34px
                rgba(15, 23, 42, 0.09);
        }

        .testcase-card:focus-visible {
            outline: 3px solid rgba(55, 100, 232, 0.22);
            outline-offset: 3px;
        }

        .tc-icon {
            display: grid;
            place-items: center;

            width: 42px;
            height: 42px;

            font-size: 15px;
            font-weight: 700;

            border-radius: 13px;
        }

        .tc-icon.passed {
            color: var(--green);
            background: var(--green-soft);
        }

        .tc-icon.failed {
            color: var(--red);
            background: var(--red-soft);
        }

        .tc-icon.skipped {
            color: var(--amber);
            background: var(--amber-soft);
        }

        .tc-id {
            color: var(--blue);

            font-size: 10px;
            font-weight: 750;
            letter-spacing: 0.75px;
            text-transform: uppercase;
        }

        .tc-name {
            margin-top: 4px;

            font-size: 14px;
            font-weight: 620;
            letter-spacing: -0.1px;
        }

        .tc-description {
            margin-top: 5px;

            overflow: hidden;

            color: var(--text-secondary);
            font-size: 11px;
            line-height: 1.5;

            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .tc-stats {
            display: flex;
            align-items: center;
            gap: 18px;

            color: var(--text-secondary);
            font-size: 11px;
        }

        .tc-stat strong {
            display: block;
            margin-bottom: 3px;

            color: var(--text-primary);
            font-size: 12px;
            font-weight: 620;
        }

        .open-indicator {
            display: grid;
            place-items: center;

            width: 30px;
            height: 30px;

            color: var(--blue);
            background: var(--blue-soft);
            border-radius: 10px;
        }

        .modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;

            display: none;
            align-items: center;
            justify-content: center;

            padding: 22px;

            background: rgba(15, 23, 42, 0.47);

            backdrop-filter: blur(13px);
            -webkit-backdrop-filter: blur(13px);
        }

        .modal-overlay.active {
            display: flex;
            animation: fadeIn 170ms ease;
        }

        .modal {
            display: flex;
            flex-direction: column;

            width: min(1120px, 100%);
            max-height: calc(100vh - 44px);

            overflow: hidden;

            background: rgba(249, 251, 255, 0.94);
            border: 1px solid rgba(255, 255, 255, 0.72);
            border-radius: 24px;

            box-shadow:
                0 34px 100px
                rgba(15, 23, 42, 0.28);

            animation: modalIn 190ms ease;
        }

        .modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;

            padding: 20px 22px;

            background: rgba(255, 255, 255, 0.76);
            border-bottom: 1px solid var(--border);

            backdrop-filter: blur(22px);
        }

        .modal-kicker {
            color: var(--blue);

            font-size: 10px;
            font-weight: 750;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .modal-title {
            margin: 5px 0 0;

            font-size: 18px;
            font-weight: 650;
            letter-spacing: -0.25px;
        }

        .modal-description {
            max-width: 760px;
            margin: 7px 0 0;

            color: var(--text-secondary);
            font-size: 12px;
            line-height: 1.6;
        }

        .modal-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .close-icon {
            display: grid;
            place-items: center;

            width: 34px;
            height: 34px;

            color: var(--text-secondary);
            font-size: 18px;

            background: rgba(241, 245, 249, 0.90);
            border: 1px solid var(--border);
            border-radius: 11px;

            cursor: pointer;

            transition:
                color 150ms ease,
                background 150ms ease;
        }

        .close-icon:hover {
            color: var(--text-primary);
            background: white;
        }

        .modal-summary {
            display: grid;
            grid-template-columns:
                repeat(5, minmax(0, 1fr));

            gap: 10px;
            padding: 15px 22px;

            background: rgba(244, 247, 252, 0.72);
            border-bottom: 1px solid var(--border);
        }

        .modal-stat {
            padding: 11px 13px;

            background: rgba(255, 255, 255, 0.72);
            border: 1px solid var(--border);
            border-radius: 13px;
        }

        .modal-stat-label {
            color: var(--text-muted);

            font-size: 9px;
            font-weight: 750;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .modal-stat-value {
            margin-top: 5px;

            font-size: 12px;
            font-weight: 620;
        }

        .modal-body {
            flex: 1;

            padding: 20px 22px 28px;
            overflow-y: auto;
        }

        .steps-heading {
            margin: 0 0 12px;

            font-size: 13px;
            font-weight: 680;
            letter-spacing: -0.1px;
        }

        .step-list {
            display: grid;
            gap: 12px;
        }

        .step-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(16px);
            border-radius: 16px;

            transition: transform 0.2s ease;
        }

        .step-card:hover {
            transform: translateY(-2px);
        }

        .step-header {
            display: grid;
            grid-template-columns:
                34px
                minmax(0, 1fr)
                auto;

            align-items: center;
            gap: 12px;

            padding: 14px 15px;
        }

        .step-number {
            display: grid;
            place-items: center;

            width: 30px;
            height: 30px;

            color: var(--blue);
            font-size: 10px;
            font-weight: 750;

            background: var(--blue-soft);
            border-radius: 10px;
        }

        .step-id {
            color: var(--text-muted);

            font-size: 9px;
            font-weight: 750;
            letter-spacing: 0.75px;
            text-transform: uppercase;
        }

        .step-name {
            margin-top: 3px;

            font-size: 13px;
            font-weight: 620;
        }

        .step-meta {
            margin-top: 5px;

            color: var(--text-secondary);
            font-size: 10px;
        }

        .step-content {
            padding: 0 15px 15px;
        }

        .screenshot-label {
            display: flex;
            align-items: center;
            justify-content: space-between;

            margin: 3px 0 8px;

            color: var(--text-secondary);
            font-size: 10px;
        }

        .screenshot {
            width: 220px;
            height: 130px;

            object-fit: cover;

            border-radius: 12px;
            border: 1px solid var(--border);

            cursor: zoom-in;

            transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;

            box-shadow:
                0 8px 20px
                rgba(0, 0, 0, 0.08);
        }

        .screenshot:hover {
            transform: translateY(-2px);

            box-shadow:
                0 15px 30px
                rgba(0, 0, 0, 0.15);
        }

        .no-screenshot {
            display: grid;
            place-items: center;

            min-height: 80px;

            color: var(--text-muted);
            font-size: 11px;

            background: rgba(241, 245, 249, 0.72);
            border: 1px dashed var(--border-strong);
            border-radius: 12px;
        }

        .error-box {
            margin-bottom: 12px;
            padding: 12px;

            color: #9f1239;

            font-family: Consolas, monospace;
            font-size: 10px;
            line-height: 1.6;

            white-space: pre-wrap;

            background: #fff1f4;
            border: 1px solid rgba(220, 76, 100, 0.15);
            border-radius: 11px;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;

            padding: 13px 22px;

            background: rgba(255, 255, 255, 0.78);
            border-top: 1px solid var(--border);
        }

        .close-button {
            padding: 8px 17px;

            color: white;
            font-size: 11px;
            font-weight: 650;

            background:
                linear-gradient(
                    135deg,
                    #466cf2,
                    #6755d9
                );

            border: 0;
            border-radius: 10px;

            box-shadow:
                0 7px 18px
                rgba(70, 108, 242, 0.23);

            cursor: pointer;
        }

        /*
         * Full-size screenshot overlay.
         * This does not alter the working test-case modal UI.
         */
        .image-viewer {
            position: fixed;
            inset: 0;
            z-index: 9999;

            display: none;

            overflow: auto;

            padding: 64px 32px 32px;

            background: rgba(6, 12, 24, 0.92);

            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }

        .image-viewer.active {
            display: flex;
            align-items: center;
            justify-content: center;

            animation: fadeIn 170ms ease;
        }
        .image-viewer-source {
            display: block;

            width: auto;
            height: auto;

            /* Fit within the screen without stretching */
            max-width: 90vw;
            max-height: 85vh;

            object-fit: contain;

            background: white;

            border: 1px solid rgba(255, 255, 255, 0.20);
            border-radius: 14px;

            box-shadow:
                0 35px 110px
                rgba(0, 0, 0, 0.58);

            cursor: default;

            animation: screenshotPopup 180ms ease-out;
        }

        .image-viewer-close {
            position: fixed;
            top: 18px;
            right: 22px;
            z-index: 10000;

            display: grid;
            place-items: center;

            width: 42px;
            height: 42px;

            padding: 0;

            color: white;

            font-size: 23px;
            line-height: 1;

            background: rgba(255, 255, 255, 0.14);

            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 13px;

            cursor: pointer;

            transition:
                background 150ms ease,
                transform 150ms ease;
        }

        .image-viewer-close:hover {
            background: rgba(255, 255, 255, 0.24);
            transform: scale(1.04);
        }

        .footer-note {
            margin-top: 22px;

            color: var(--text-muted);
            font-size: 10px;
            text-align: center;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        @keyframes modalIn {
            from {
                opacity: 0;

                transform:
                    translateY(10px)
                    scale(0.985);
            }

            to {
                opacity: 1;

                transform:
                    translateY(0)
                    scale(1);
            }
        }

        @keyframes screenshotPopup {
            from {
                opacity: 0;
                transform: scale(0.96);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @media (max-width: 920px) {

            .execution-info {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .info-card-primary {
                grid-column: 1 / -1;
            }

            .modal-summary {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .testcase-card {
                grid-template-columns:
                    44px
                    minmax(0, 1fr)
                    32px;
            }

            .tc-stats {
                display: none;
            }
        }

        @media (max-width: 580px) {

            .page-shell {
                width: min(100% - 20px, 1320px);
                padding-top: 14px;
            }

            .topbar {
                align-items: flex-start;
                flex-direction: column;
                padding: 18px;
            }

            .execution-info {
                grid-template-columns: 1fr;
            }

            .info-card-primary {
                grid-column: auto;
            }

            .content-header {
                align-items: flex-start;
                flex-direction: column;
            }

            .testcase-card {
                padding: 12px;
            }

            .tc-description {
                display: none;
            }

            .modal-overlay {
                padding: 8px;
            }

            .modal {
                max-height: calc(100vh - 16px);
                border-radius: 18px;
            }

            .modal-header {
                padding: 16px;
            }

            .modal-summary {
                padding: 12px 16px;
            }

            .modal-body {
                padding: 16px;
            }

            .step-header {
                grid-template-columns:
                    30px
                    minmax(0, 1fr);
            }

            .step-header .overall-status {
                grid-column: 2;
                justify-self: start;
            }
        }
    </style>
</head>

<body>

    <main class="page-shell">

        <header class="topbar glass-panel">

            <div class="brand">

                <div class="brand-mark">
                    PF
                </div>

                <div>

                    <h1 class="brand-title">
                        Automation Report
                    </h1>

                    <p class="brand-subtitle">
                        Playwright codeless automation analysis
                    </p>

                </div>

            </div>

            ${this.statusBadge(result.status)}

        </header>

        <section class="execution-info">

            <article class="info-card info-card-primary">

                <div class="eyebrow">
                    Execution
                </div>

                <h2 class="execution-id">
                    ${this.escapeHtml(result.executionId)}
                </h2>

                <div class="execution-meta">

                    <span>
                        Environment:
                        ${this.escapeHtml(result.environment)}
                    </span>

                    <span>
                        Browser:
                        ${this.escapeHtml(result.browser)}
                    </span>

                    <span>
                        Duration:
                        ${this.formatDuration(result.duration)}
                    </span>

                </div>

            </article>

            ${this.metricCard(
                'Total',
                result.totalTestCases,
                ''
            )}

            ${this.metricCard(
                'Passed',
                result.passedTestCases,
                'metric-passed'
            )}

            ${this.metricCard(
                'Failed',
                result.failedTestCases,
                'metric-failed'
            )}

        </section>

        <section>

            <div class="content-header">

                <div>

                    <h2 class="content-title">
                        Test case analysis
                    </h2>

                    <p class="content-description">
                        Select a test case to inspect its steps and execution evidence.
                    </p>

                </div>

                <div class="testcase-count">
                    ${result.totalTestCases}
                    test case${result.totalTestCases === 1 ? '' : 's'}
                </div>

            </div>

            <div class="testcase-list">

                ${
                    testCaseCards ||
                    `
                        <div class="info-card">
                            No test case results are available.
                        </div>
                    `
                }

            </div>

        </section>

        <div class="footer-note">
            Developed By Subramanyam
        </div>

    </main>

    ${testCaseModals}

    <!--
        Full-size screenshot viewer.
        The missing imageViewerSource element was the reason
        the previous popup did not work.
    -->
    <div
    id="imageViewer"
    class="image-viewer"
    onclick="handleImageViewerOverlayClick(event)"
>
    <button
        type="button"
        class="image-viewer-close"
        onclick="closeImageViewer(event)"
        aria-label="Close screenshot preview"
    >
        ×
    </button>

    <img
        id="imageViewerSource"
        class="image-viewer-source"
        alt="Full-size execution screenshot"
        onclick="event.stopPropagation()"
    />
</div>

    <script>

        let activeModalId = null;

        function openTestCaseModal(modalId) {

            const modal =
                document.getElementById(
                    modalId
                );

            if (!modal) {
                return;
            }

            modal.classList.add(
                'active'
            );

            activeModalId = modalId;

            document.body.classList.add(
                'modal-open'
            );
        }

        function closeTestCaseModal(modalId) {

            const targetId =
                modalId ||
                activeModalId;

            if (!targetId) {
                return;
            }

            const modal =
                document.getElementById(
                    targetId
                );

            if (modal) {

                modal.classList.remove(
                    'active'
                );
            }

            activeModalId = null;

            document.body.classList.remove(
                'modal-open'
            );
        }

        function handleOverlayClick(
            event,
            modalId
        ) {

            if (
                event.target ===
                event.currentTarget
            ) {

                closeTestCaseModal(
                    modalId
                );
            }
        }

        function openImageViewer(source) {

            const viewer =
                document.getElementById(
                    'imageViewer'
                );

            const image =
                document.getElementById(
                    'imageViewerSource'
                );

            if (!viewer || !image) {

                console.error(
                    'Screenshot viewer elements are missing.'
                );

                return;
            }

            image.src = source;

            viewer.classList.add(
                'active'
            );

            viewer.scrollTop = 0;
            viewer.scrollLeft = 0;

            document.body.classList.add(
                'modal-open'
            );
        }

        function handleImageViewerOverlayClick(
            event
        ) {

            /*
             * The viewer closes only when the dark background
             * itself is clicked.
             */
            if (
                event.target ===
                event.currentTarget
            ) {

                closeImageViewer();
            }
        }

        function closeImageViewer(event) {

            if (event) {

                event.preventDefault();
                event.stopPropagation();
            }

            const viewer =
                document.getElementById(
                    'imageViewer'
                );

            const image =
                document.getElementById(
                    'imageViewerSource'
                );

            if (!viewer || !image) {
                return;
            }

            viewer.classList.remove(
                'active'
            );

            image.removeAttribute(
                'src'
            );

            /*
             * Keep scrolling locked while the testcase
             * details modal remains open.
             */
            if (!activeModalId) {

                document.body.classList.remove(
                    'modal-open'
                );
            }
        }

        document.addEventListener(
            'keydown',
            function(event) {

                if (event.key !== 'Escape') {
                    return;
                }

                const viewer =
                    document.getElementById(
                        'imageViewer'
                    );

                if (
                    viewer &&
                    viewer.classList.contains(
                        'active'
                    )
                ) {

                    closeImageViewer();
                    return;
                }

                closeTestCaseModal();
            }
        );

    </script>

</body>

</html>
        `;

        fs.writeFileSync(
            reportFile,
            html,
            'utf-8'
        );
    }

    private static buildTestCaseCard(
        testCase: TestCaseResult,
        index: number
    ): string {

        const modalId =
            `testcase-modal-${index}`;

        const icon =
            testCase.status === 'Passed'
                ? '✓'
                : testCase.status === 'Failed'
                    ? '!'
                    : '–';

        return `
<button
    type="button"
    class="testcase-card"
    onclick="openTestCaseModal('${modalId}')"
>

    <div class="tc-icon ${testCase.status.toLowerCase()}">
        ${icon}
    </div>

    <div>

        <div class="tc-id">
            ${this.escapeHtml(testCase.testCaseId)}
        </div>

        <div class="tc-name">
            ${this.escapeHtml(testCase.testCaseName)}
        </div>

        <div class="tc-description">
            ${this.escapeHtml(
                testCase.description ||
                'No description is available for this test case.'
            )}
        </div>

    </div>

    <div class="tc-stats">

        <div class="tc-stat">

            <strong>
                ${this.formatDuration(testCase.duration)}
            </strong>

            Duration

        </div>

        <div class="tc-stat">

            <strong>
                ${testCase.passedSteps}/${testCase.totalSteps}
            </strong>

            Steps passed

        </div>

        ${this.statusBadge(testCase.status)}

    </div>

    <div class="open-indicator">
        ›
    </div>

</button>
        `;
    }

    private static buildTestCaseModal(
        testCase: TestCaseResult,
        index: number
    ): string {

        const modalId =
            `testcase-modal-${index}`;

        const steps = testCase.steps
            .map((step, stepIndex) =>
                this.buildStepCard(
                    step,
                    stepIndex
                )
            )
            .join('');

        return `
<div
    id="${modalId}"
    class="modal-overlay"
    onclick="handleOverlayClick(event, '${modalId}')"
>

    <section
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="${this.escapeHtml(testCase.testCaseName)}"
    >

        <header class="modal-header">

            <div>

                <div class="modal-kicker">
                    Test case details ·
                    ${this.escapeHtml(testCase.testCaseId)}
                </div>

                <h2 class="modal-title">
                    ${this.escapeHtml(testCase.testCaseName)}
                </h2>

                <p class="modal-description">
                    ${this.escapeHtml(
                        testCase.description ||
                        'No description is available for this test case.'
                    )}
                </p>

            </div>

            <div class="modal-header-actions">

                ${this.statusBadge(testCase.status)}

                <button
                    type="button"
                    class="close-icon"
                    onclick="closeTestCaseModal('${modalId}')"
                    aria-label="Close test case details"
                >
                    ×
                </button>

            </div>

        </header>

        <section class="modal-summary">

            ${this.modalStat(
                'Module',
                testCase.module || 'Not specified'
            )}

            ${this.modalStat(
                'Priority',
                testCase.priority || 'Not specified'
            )}

            ${this.modalStat(
                'Duration',
                this.formatDuration(testCase.duration)
            )}

            ${this.modalStat(
                'Passed steps',
                String(testCase.passedSteps)
            )}

            ${this.modalStat(
                'Failed steps',
                String(testCase.failedSteps)
            )}

        </section>

        <div class="modal-body">

            <h3 class="steps-heading">
                Step execution evidence
            </h3>

            <div class="step-list">

                ${
                    steps ||
                    `
                        <div class="no-screenshot">
                            No step results are available.
                        </div>
                    `
                }

            </div>

        </div>

        <footer class="modal-footer">

            <button
                type="button"
                class="close-button"
                onclick="closeTestCaseModal('${modalId}')"
            >
                Close details
            </button>

        </footer>

    </section>

</div>
        `;
    }

private static buildStepCard(
    step: StepResult,
    stepIndex: number
): string {

    const screenshotPath =
        step.screenshot
            ? this.escapeHtml(step.screenshot)
            : '';

    const screenshotAlt =
        this.escapeHtml(
            `${step.stepName} screenshot`
        );

    const screenshot = step.screenshot
        ? `
            <div class="screenshot-label">

                <span>
                    Screenshot after step execution
                </span>

                <span>
                    Click to enlarge
                </span>

            </div>

            <img
                class="screenshot"
                src="${screenshotPath}"
                alt="${screenshotAlt}"
                loading="lazy"
                onclick="openImageViewer(this.src)"
            />
          `
        : `
            <div class="no-screenshot">
                No screenshot captured for this step
            </div>
          `;

    const error = step.error
        ? `
            <div class="error-box">
                ${this.escapeHtml(step.error)}
            </div>
          `
        : '';

    return `
<article class="step-card">

    <div class="step-header">

        <div class="step-number">
            ${stepIndex + 1}
        </div>

        <div>

            <div class="step-id">
                ${this.escapeHtml(step.stepId)}
            </div>

            <div class="step-name">
                ${this.escapeHtml(step.stepName)}
            </div>

            <div class="step-meta">
                Action:
                ${this.escapeHtml(step.action)}
                ·
                Duration:
                ${this.formatDuration(step.duration)}
            </div>

        </div>

        ${this.statusBadge(step.status)}

    </div>

    <div class="step-content">
        ${error}
        ${screenshot}
    </div>

</article>
    `;
}

    private static statusBadge(
        status: string
    ): string {

        const className =
            status === 'Passed'
                ? 'status-passed'
                : status === 'Failed'
                    ? 'status-failed'
                    : 'status-skipped';

        return `
<span class="overall-status ${className}">

    <span class="status-dot"></span>

    ${this.escapeHtml(status)}

</span>
        `;
    }

    private static metricCard(
        label: string,
        value: string | number,
        valueClass: string
    ): string {

        return `
<article class="info-card">

    <div class="eyebrow">
        ${this.escapeHtml(label)}
    </div>

    <div class="metric-value ${valueClass}">
        ${this.escapeHtml(String(value))}
    </div>

</article>
        `;
    }

    private static modalStat(
        label: string,
        value: string
    ): string {

        return `
<div class="modal-stat">

    <div class="modal-stat-label">
        ${this.escapeHtml(label)}
    </div>

    <div class="modal-stat-value">
        ${this.escapeHtml(value)}
    </div>

</div>
        `;
    }

    private static formatDuration(
        duration: number
    ): string {

        if (duration < 1000) {
            return `${duration} ms`;
        }

        const totalSeconds =
            duration / 1000;

        if (totalSeconds < 60) {

            return `${totalSeconds.toFixed(2)} sec`;
        }

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            Math.round(totalSeconds % 60);

        return `${minutes} min ${seconds} sec`;
    }

    private static escapeHtml(
    value: string
): string {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
}