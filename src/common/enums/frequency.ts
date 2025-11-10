import { RRule } from 'rrule';

export const frequencyMap: Record<number, string> = {
    [RRule.YEARLY]: 'Yearly',
    [RRule.MONTHLY]: 'Monthly',
    [RRule.WEEKLY]: 'Weekly',
    [RRule.DAILY]: 'Daily',
    [RRule.HOURLY]: 'Hourly',
    [RRule.MINUTELY]: 'Minutely',
    [RRule.SECONDLY]: 'Secondly',
};
