import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Header,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "../public/templates/Client-Project-Intake-Template.docx");
const BLUE = "2E74B5";
const DARK_BLUE = "1F4D78";
const INK = "0B2545";
const MUTED = "5D6B7A";
const LIGHT_BLUE = "E8EEF5";
const LIGHT_GRAY = "F2F4F7";
const CALLOUT = "F4F6F9";
const tableBorders = { top: { style: BorderStyle.SINGLE, size: 4, color: "B8C4D0" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "B8C4D0" }, left: { style: BorderStyle.SINGLE, size: 4, color: "B8C4D0" }, right: { style: BorderStyle.SINGLE, size: 4, color: "B8C4D0" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "D8E0E8" }, insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "D8E0E8" } };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const run = (text, options = {}) => new TextRun({ text, font: "Calibri", size: 22, color: INK, ...options });
const body = (text, options = {}) => new Paragraph({ children: [run(text, options)], spacing: { after: 120, line: 300 }, ...options.paragraph });
const heading = (text, level = HeadingLevel.HEADING_1) => new Paragraph({ text, heading: level, spacing: level === HeadingLevel.HEADING_1 ? { before: 360, after: 200, line: 300 } : { before: 280, after: 140, line: 300 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function labelled(label, text) {
  return new Paragraph({
    children: [run(label, { bold: true, color: DARK_BLUE }), run(text)],
    spacing: { after: 80, line: 300 },
  });
}

function promptTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    indent: { size: 120, type: WidthType.DXA },
    borders: tableBorders,
    rows: rows.map(([label, hint]) => new TableRow({ children: [
      new TableCell({ width: { size: 2700, type: WidthType.DXA }, margins: cellMargins, shading: { type: ShadingType.CLEAR, color: LIGHT_GRAY, fill: LIGHT_GRAY }, children: [new Paragraph({ children: [run(label, { bold: true, color: DARK_BLUE, size: 20 })], spacing: { after: 40, line: 280 } })] }),
      new TableCell({ width: { size: 6660, type: WidthType.DXA }, margins: cellMargins, children: [new Paragraph({ children: [run(hint, { italic: true, color: MUTED, size: 20 })], spacing: { after: 40, line: 280 } }), new Paragraph({ text: "", spacing: { after: 260 } })] }),
    ] })),
  });
}

function sectionIntro(number, title, why, example) {
  return [
    heading(`${number}. ${title}`),
    labelled("Why we need this: ", why),
    labelled("Good answer: ", example),
  ];
}

function checklistItem(text) {
  return new Paragraph({ text, numbering: { reference: "checks", level: 0 }, spacing: { after: 100, line: 300 } });
}

const children = [
  new Paragraph({ children: [run("Client Project Intake Template", { bold: true, size: 50, color: INK })], spacing: { after: 80 }, keepNext: true }),
  new Paragraph({ children: [run("A guided requirements brief for your project manager", { size: 26, color: "4B6275" })], spacing: { after: 320 }, keepNext: true }),
  new Table({ width: { size: 9360, type: WidthType.DXA }, indent: { size: 120, type: WidthType.DXA }, borders: tableBorders, rows: [new TableRow({ children: [new TableCell({ margins: cellMargins, shading: { type: ShadingType.CLEAR, color: CALLOUT, fill: CALLOUT }, children: [
    new Paragraph({ children: [run("Before you begin", { bold: true, color: DARK_BLUE })], spacing: { after: 80, line: 300 } }),
    new Paragraph({ children: [run("Describe the outcome your team needs in plain language. Be specific, testable, and scoped. Do not include passwords, API keys, production credentials, private keys, or unnecessary personal data.", { size: 21 })], spacing: { after: 40, line: 300 } }),
  ] })] })] }),
  heading("How to use this template", HeadingLevel.HEADING_2),
  body("Complete every numbered section. If data, integrations, or supporting documents do not apply, write “Not applicable” and explain briefly. Your PM reviews the intake, requests focused changes if needed, then locks an immutable version for the AI delivery workflow."),
  promptTable([
    ["Business name", "Enter the organization or business name"],
    ["Project name", "Enter a short, recognizable project name"],
    ["Primary contact", "Name, email, and best way to reach you"],
    ["Final approver", "The person who can approve scope and decisions"],
    ["Desired launch", "Target month, quarter, or date"],
  ]),
  pageBreak(),
  ...sectionIntro("1", "Project overview", "This anchors the business outcome and makes success measurable.", "Reduce manual appointment booking by 40% before the October launch."),
  promptTable([
    ["Problem statement", "What is difficult, slow, costly, risky, or confusing today?"],
    ["Business goal", "What outcome should this project achieve?"],
    ["Success measure 1", "Use a number, a date, or observable behavior"],
    ["Success measure 2", "Add another measurable result"],
  ]),
  pageBreak(),
  ...sectionIntro("2", "Users and roles", "Responsibilities and permissions prevent access gaps and make workflows realistic.", "Scheduler: creates appointments; can edit only appointments for their own branch."),
  promptTable([
    ["User role", "Name the user group, for example customer, scheduler, or manager"],
    ["Responsibilities", "What does this person need to accomplish?"],
    ["Permissions", "What can this role view, create, change, approve, or delete?"],
    ["Data access", "Which records can this role see or edit?"],
  ]),
  body("Add another copy of this role section for each distinct user group.", { italic: true, color: MUTED, size: 20 }),
  pageBreak(),
  ...sectionIntro("3", "Scope and features", "A focused, testable feature list lets the PM lock the first release with confidence.", "Must-have: a customer selects a time, receives confirmation, and the slot cannot be double-booked."),
  promptTable([
    ["Feature title and priority", "Mark Must-have, Should-have, or Nice-to-have"],
    ["Purpose and primary user", "Why does this matter, and who uses it?"],
    ["Trigger and workflow", "What starts it, and what happens from start to finish?"],
    ["Business rules", "State constraints, approvals, calculations, or exceptions"],
    ["Acceptance criteria", "Write a testable outcome, ideally using Given / When / Then"],
    ["Out of scope", "What is explicitly excluded from this release?"],
    ["Future phase", "What is valuable but should wait for a later phase?"],
  ]),
  pageBreak(),
  ...sectionIntro("4", "Workflows", "Steps, decisions, and error cases show how the system must behave in real situations.", "If a selected time is unavailable, show alternatives and do not create a booking."),
  promptTable([
    ["Workflow title", "Name the end-to-end activity"],
    ["Starting condition and actor", "What begins this, and who performs it?"],
    ["Steps", "List the ordered actions and system responses"],
    ["Decision points", "What choices or approvals change the path?"],
    ["Error cases", "What could fail, and what should the user see or do?"],
    ["Final outcome", "What confirms the workflow finished successfully?"],
  ]),
  pageBreak(),
  ...sectionIntro("5", "Data and integrations", "Data ownership, retention, and integrations must be visible before implementation begins.", "Appointment: name, service, time; staff can edit their branch only. Payment provider: Stripe, owned by Finance."),
  promptTable([
    ["Data entities and fields", "List records such as customer, order, appointment, or case and their important fields"],
    ["Ownership and access", "Who owns the data? Who may view or edit it?"],
    ["Retention and sample data", "How long should it be kept? Provide safe, non-production examples only"],
    ["Integrations / APIs", "Name the service, purpose, data exchanged, and responsible client owner"],
    ["Not applicable", "If no data entities or integrations apply, write “Not applicable” and why"],
  ]),
  pageBreak(),
  ...sectionIntro("6", "Design, security, and delivery", "Experience, security, and delivery constraints shape the right solution and timeline.", "Mobile-first, WCAG 2.1 AA, English and Filipino content, user testing by 15 September."),
  promptTable([
    ["Brand and content", "Brand assets, preferred look, content owner, tone, and reference links"],
    ["Accessibility and devices", "Accessibility target, browsers, devices, languages, and assistive-technology needs"],
    ["Security, privacy, and compliance", "Required standards, data classification, audit, privacy, availability, or performance expectations"],
    ["Timeline and milestones", "Target dates, review points, dependencies, and client responsibilities"],
    ["Constraints", "Budget, technology, policy, legal, procurement, or operational constraints"],
  ]),
  pageBreak(),
  ...sectionIntro("7", "Documents and final confirmation", "Source documents provide evidence so the team does not need to guess.", "Current process map, brand guide, sample report, or “Not applicable — no supporting documents exist.”"),
  promptTable([
    ["Supporting documents", "List title, purpose, version/date, and where it is attached"],
    ["Documents not applicable", "If none are needed, state why"],
    ["Open questions", "What still needs a decision or client answer?"],
    ["Client confirmation", "I confirm this information is accurate, specific, testable, and within the requested scope."],
    ["Name, role, date", "Enter the person submitting the intake and the date"],
  ]),
  heading("PM review checklist", HeadingLevel.HEADING_2),
  checklistItem("All required sections are complete and every Must-have feature has testable acceptance criteria."),
  checklistItem("Roles, workflows, scope exclusions, future phase, and final approver are identified."),
  checklistItem("Uploaded documents extracted successfully, or the client explicitly marked them not applicable."),
  checklistItem("No critical conflict remains unresolved; PM notes record any accepted assumption."),
  checklistItem("The PM has recorded a review action before locking the version for orchestration."),
];

const document = new Document({
  creator: "AlphaExplora",
  title: "Client Project Intake Template",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22, color: INK }, paragraph: { spacing: { after: 120, line: 300 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 32, bold: true, color: BLUE }, paragraph: { spacing: { before: 360, after: 200, line: 300 }, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 26, bold: true, color: BLUE }, paragraph: { spacing: { before: 280, after: 140, line: 300 }, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Calibri", size: 24, bold: true, color: DARK_BLUE }, paragraph: { spacing: { before: 200, after: 100, line: 300 }, keepNext: true } },
    ],
  },
  numbering: { config: [{ reference: "checks", levels: [{ level: 0, format: LevelFormat.BULLET, text: "☐", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 }, spacing: { after: 100, line: 300 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 708, footer: 708 } } },
    headers: { default: new Header({ children: [new Paragraph({ children: [run("CLIENT PROJECT INTAKE TEMPLATE", { size: 17, color: MUTED, bold: true })], spacing: { after: 0 } })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("Confidential — do not include passwords, API keys, production credentials, or unnecessary personal data.", { size: 16, color: MUTED })], spacing: { before: 0 } })] }) },
    children,
  }],
});

await mkdir(dirname(output), { recursive: true });
await writeFile(output, await Packer.toBuffer(document));
console.log(output);
