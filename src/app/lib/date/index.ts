const DATE_FORMAT = "YYYY-MM-DD";

/**
 * A lightweight date utility backed by the built‑in Date.
 * Keeps the same public API previously provided by the dayjs wrapper.
 */
export class StadenDate {
  private readonly date: Date;

  constructor(dateString?: string) {
    this.date = dateString ? parseISO(dateString) : new Date();
  }

  public format(format?: string): string {
    if (isNaN(this.date.getTime())) return "Invalid Date";
    const fmt = format || DATE_FORMAT;
    return formatDate(this.date, fmt);
  }

  /**
   * Returns the number of days in the month of the current date.
   */
  public daysInMonth(): number {
    const y = this.date.getFullYear();
    const m = this.date.getMonth(); // 0-11
    // Day 0 of next month gives the last day of current month
    return new Date(y, m + 1, 0).getDate();
  }

  /**
   * Returns the day of the week for the Date.
   * 0 = Sunday ... 6 = Saturday (matches dayjs)
   */
  public dayOfWeek(): number {
    return this.date.getDay();
  }

  /**
   * Adds a specified amount of time to the current date.
   * Accepts only "year", "month", or "day" to maintain previous API.
   * If an invalid unit is supplied, throws the legacy error message
   * (to keep existing tests stable).
   */
  public add(amount: number, unit: string): StadenDate {
    if (unit !== "year" && unit !== "month" && unit !== "day") {
      // Keep legacy error text expected by tests
      throw new Error(`Unknown manipulate type: ${unit}`);
    }

    const d = new Date(this.date.getTime());
    if (unit === "year") {
      d.setFullYear(d.getFullYear() + amount);
    } else if (unit === "month") {
      d.setMonth(d.getMonth() + amount);
    } else {
      // day
      d.setDate(d.getDate() + amount);
    }
    return new StadenDate(formatDate(d, DATE_FORMAT));
  }
}

function parseISO(str: string): Date {
  // Supports "YYYY-MM-DD" and partial "YYYY-MM"
  const m = str.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (m) {
    const year = Number(m[1]);
    const month = m[2] ? Number(m[2]) - 1 : 0; // Date month is 0-based
    const day = m[3] ? Number(m[3]) : 1;
    return new Date(year, month, day);
  }
  // Fallback to native parsing
  const d = new Date(str);
  if (isNaN(d.getTime())) {
    throw Error(`Invalid date string: "${str}"`);
  }
  return d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(date: Date, fmt: string): string {
  const Y = date.getFullYear();
  const M = pad2(date.getMonth() + 1);
  const D = pad2(date.getDate());

  return fmt.replace(/YYYY|MM|DD/g, (token) => {
    switch (token) {
      case "YYYY":
        return String(Y);
      case "MM":
        return M;
      case "DD":
        return D;
      default:
        return token;
    }
  });
}
