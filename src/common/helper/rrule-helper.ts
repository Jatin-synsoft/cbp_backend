import { DayOfWeek } from "../enums/dayofweeek.enum";
import * as dayjs from "dayjs";
import { rrulestr } from 'rrule';

export function dayToRRuleDay(day: number | string | DayOfWeek): number {
    const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    const dayStr = typeof day === "string" ? day : DayOfWeek[day];
    return days.indexOf(dayStr.toUpperCase().substring(0, 2));
}

export function formatTime(isoString: string, tz = "UTC"): string {
    return dayjs(isoString).tz(tz).format("hh:mm A");
}

export function extractDtstartFromRrule(rruleString: string): Date | null {
    try {
        const rule = rrulestr(rruleString);
        const dtstart = rule.options.dtstart;
        if (!dtstart || isNaN(dtstart.getTime())) return null;
        return dtstart;
    } catch (error) {
        console.error('Invalid RRULE string:', error);
        return null;
    }
}

export function getDtstartDate(rruleString: string): string | null {
    try {
        const rule = rrulestr(rruleString);
        const dtstart = rule.options.dtstart;
        if (!dtstart) return null;

        // Convert to YYYY-MM-DD (local or UTC — choose below)
        return dtstart.toISOString().split('T')[0]; // 👉 "2025-11-05"
    } catch {
        return null;
    }
}
