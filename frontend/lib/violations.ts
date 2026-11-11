export type ViolationDetail = {
  code: string;
  title: string;
  message: string;
  steps: string[];
  link?: string;
  severity?: "error" | "warning" | "info";
};

export class ApiError extends Error {
  violation?: ViolationDetail;

  constructor(message: string, violation?: ViolationDetail) {
    super(message);
    this.name = "ApiError";
    this.violation = violation;
  }
}

export function getApiError(err: unknown): { message: string; violation?: ViolationDetail } {
  if (err instanceof ApiError) {
    return { message: err.message, violation: err.violation };
  }
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: "Something went wrong. Please try again." };
}

export const EXCEPTION_GUIDES: Record<string, ViolationDetail> = {
  late_check_in: {
    code: "late_check_in",
    title: "Late check-in",
    message: "You checked in outside the on-time window.",
    severity: "warning",
    link: "/employee/exceptions",
    steps: [
      "Submit an explanation describing why you were late.",
      "Wait for admin review if your attendance needs correction.",
    ],
  },
  late_check_out: {
    code: "late_check_out",
    title: "Late check-out",
    message: "You checked out after the allowed grace period.",
    severity: "warning",
    link: "/employee/exceptions",
    steps: [
      "Explain why you worked past your scheduled end time.",
      "Wait for admin review if overtime needs approval.",
    ],
  },
  missing_check_out: {
    code: "missing_check_out",
    title: "Missing check-out",
    message: "You checked in but did not check out before the day ended.",
    severity: "error",
    link: "/employee/exceptions",
    steps: [
      "Submit an explanation with your actual finish time.",
      "Contact admin if your hours need to be corrected.",
    ],
  },
  missing_check_in: {
    code: "missing_check_in",
    title: "Missing attendance",
    message: "No check-in was recorded for this day.",
    severity: "error",
    link: "/employee/exceptions",
    steps: [
      "Explain whether you were absent, on leave, or forgot to check in.",
      "Wait for admin to update your attendance record.",
    ],
  },
  excessive_hours: {
    code: "excessive_hours",
    title: "Excessive working hours",
    message: "Your recorded hours exceeded the daily limit.",
    severity: "warning",
    link: "/employee/exceptions",
    steps: [
      "Confirm whether overtime was approved.",
      "Submit an explanation if the extra hours were required.",
    ],
  },
  late_schedule: {
    code: "late_schedule",
    title: "Missed schedule submission",
    message: "Your weekly schedule was not submitted before the deadline.",
    severity: "error",
    link: "/employee/schedule",
    steps: [
      "Submit your schedule as soon as possible.",
      "Request a schedule change if you need admin help updating a locked week.",
    ],
  },
  schedule_change: {
    code: "schedule_change",
    title: "Schedule change request",
    message: "You requested a change to your work schedule.",
    severity: "info",
    link: "/employee/schedule",
    steps: [
      "Wait for admin to approve or reject the request.",
      "Check back here for admin feedback on the exception.",
    ],
  },
  overdue_task: {
    code: "overdue_task",
    title: "Overdue task",
    message: "A task passed its due date without being completed.",
    severity: "warning",
    link: "/employee/tasks",
    steps: [
      "Open My Tasks and complete or update the overdue work.",
      "Add an explanation here if you need more time or support.",
    ],
  },
};

export function guideForException(type: string): ViolationDetail | null {
  return EXCEPTION_GUIDES[type] ?? null;
}
