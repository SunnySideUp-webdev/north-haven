export const CAPACITY_REMINDER_THRESHOLD = 9;

export function shouldShowCapacityReminder(actionableItemCount: number) {
  return actionableItemCount >= CAPACITY_REMINDER_THRESHOLD;
}
