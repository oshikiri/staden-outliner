import dayjs from "dayjs";

const DATE_FORMAT = "YYYY-MM-DD";

/**
 * A class that represents a Date.
 * This class is a wrapper around the dayjs library in order to replace dayjs in the future.
 */
export class StadenDate {
  private dateDayjs: dayjs.Dayjs;
  constructor(dateString?: string) {
    this.dateDayjs = dayjs(dateString);
  }

  public format(format?: string): string {
    return this.dateDayjs.format(format || DATE_FORMAT);
  }

  /**
   * Returns the number of days in the month of the current date.
   *
   * @returns {number} The number of days in the month.
   */
  public daysInMonth(): number {
    return this.dateDayjs.daysInMonth();
  }

  /**
   * Returns the day of the week for the Date.
   *
   * @returns {number} The day of the week, where 0 represents Sunday and 6 represents Saturday.
   */
  public dayOfWeek(): number {
    return this.dateDayjs.day();
  }

  public add(amount: number, unit: string): StadenDate {
    const dayjsUnit = convertToManipulateType(unit);
    const dayjsDate = this.dateDayjs.add(amount, dayjsUnit);
    return new StadenDate(dayjsDate.format(DATE_FORMAT));
  }
}

function convertToManipulateType(str: string): dayjs.ManipulateType {
  if (str === "y" || str === "year") {
    return "year";
  } else if (str === "m" || str === "month") {
    return "month";
  } else if (str === "d" || str === "day") {
    return "day";
  }
  throw new Error(`Unknown manipulate type: ${str}`);
}
