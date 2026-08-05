import type {
  DevFlowIntakeSectionId,
  DevFlowIntakeSectionStatus,
  DevFlowIntakeTemplate,
  DevFlowIntakeTemplateField,
} from "@/shared/api/devflow-api";

/**
 * Reads intake question wording out of the API-served worksheet.
 *
 * Every label and helper in the intake form comes from here, keyed by the payload property it
 * fills. Hardcoding them in the form is what let the two registers appear: a client downloaded
 * "Rules that must always hold" and then filled in "Business rules", and "How you will know it
 * works" became "Testable acceptance criteria". Same question, two vocabularies, no way to
 * notice they had diverged.
 *
 * `fallback` exists because the template arrives with the intake response, and a form should
 * render something sensible on an older API or a failed load rather than show blank labels.
 */
export function intakeCopy(template: DevFlowIntakeTemplate | undefined) {
  const bySection = new Map<DevFlowIntakeSectionId, Map<string, DevFlowIntakeTemplateField>>();
  for (const section of template?.sections ?? []) {
    const fields = new Map<string, DevFlowIntakeTemplateField>();
    for (const field of section.fields) {
      if (field.key) fields.set(field.key, field);
    }
    bySection.set(section.id, fields);
  }

  return {
    /** Plain-language step title, e.g. "3. What it needs to do". */
    sectionTitle(section: DevFlowIntakeSectionId, fallback: string): string {
      return template?.sections.find((item) => item.id === section)?.title ?? fallback;
    },
    /** Why the step is asked, in the client's terms. */
    sectionPurpose(section: DevFlowIntakeSectionId, fallback = ""): string {
      return template?.sections.find((item) => item.id === section)?.purpose ?? fallback;
    },
    /** Label + helper + example for one question, falling back to the supplied wording. */
    field(
      section: DevFlowIntakeSectionId,
      key: string,
      fallback: { label: string; helper?: string },
    ): { label: string; helper: string; example?: string } {
      const found = bySection.get(section)?.get(key);
      return {
        label: found?.label ?? fallback.label,
        helper: found?.helper ?? fallback.helper ?? "",
        example: found?.example,
      };
    },
  };
}

export type IntakeCopy = ReturnType<typeof intakeCopy>;

/**
 * Step numbers and completion for a progress rail.
 *
 * Completion comes from the API's `readiness.sections` rather than being re-derived here — the
 * rule that decides whether a step is done is the same rule that blocks submission, so it must
 * be computed once, server-side. Steps the API did not report are shown as incomplete rather
 * than optimistically complete, so an older API never lets a client believe they are finished.
 */
export function intakeStepProgress(
  sections: DevFlowIntakeSectionStatus[] | undefined,
  order: readonly DevFlowIntakeSectionId[],
) {
  const status = new Map((sections ?? []).map((item) => [item.section, item]));
  const steps = order.map((section, index) => {
    const found = status.get(section);
    return {
      section,
      number: index + 1,
      complete: Boolean(found?.complete),
      missing: found?.missing ?? [],
      reported: Boolean(found),
    };
  });
  const reported = steps.filter((step) => step.reported);
  return {
    steps,
    completeCount: reported.filter((step) => step.complete).length,
    totalCount: reported.length || order.length,
  };
}
