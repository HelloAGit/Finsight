export function approvalUpdate(
  edited: boolean,
  status?: "draft" | "approved" | "rejected",
) {
  if (edited) {
    if (status === "approved")
      throw new Error("Save edits before approving the revised copy");
    return { status: "draft", approvedAt: null };
  }
  return status
    ? { status, approvedAt: status === "approved" ? new Date() : null }
    : {};
}
