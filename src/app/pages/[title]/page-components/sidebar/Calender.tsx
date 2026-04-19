import { JSX, useEffect, useState } from "react";

import { StadenDate } from "@/app/lib/date";
import type { File } from "@/app/lib/file";
import { systemRpc } from "@/app/api/rpc/system";
import { usePageNavigation } from "../../navigation";

// eslint-disable-next-line max-lines-per-function
export function JournalCalender({ pathname }: { pathname: string }) {
  const dateFromPathname = getDateFromPathname(pathname);
  const monthFromPathname = dateFromPathname
    ? new StadenDate(dateFromPathname).format("YYYY-MM")
    : undefined;

  const [days, setDays] = useState<string[]>();
  const [month, setMonth] = useState<string>(
    monthFromPathname || new StadenDate().format("YYYY-MM"),
  );

  useEffect(() => {
    systemRpc
      .files(month)
      .then((files) => setDays(files.map((file: File) => file.title)));
  }, [month]);

  const dayExists = new Map<string, boolean>();
  days?.forEach((day) => dayExists.set(day, true));
  const month1stDay = new StadenDate(`${month}-01`);
  const daysInMonth = month1stDay.daysInMonth();

  // Fill the first week with nulls to align the first day of the month
  const daysArray = Array(month1stDay.dayOfWeek())
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
    .map((dayNum: number) => {
      if (dayNum === null) return { dayNum };
      const dayStr = month1stDay.add(dayNum - 1, "day").format();
      const exists = dayExists.get(dayStr);
      const currentPage = dayStr === dateFromPathname;
      return { dayNum, dayStr, exists, currentPage };
    });

  return (
    <div
      className="
        border border-primary/50
        rounded-lg
        w-fit
      "
    >
      <div
        key="header"
        className="
          grid grid-cols-[10%_80%_10%]
          p-2
          justify-center
        "
      >
        <MoveToPrevMonth month1stDay={month1stDay} setMonth={setMonth} />
        <div className="text-center">{month}</div>
        <MoveToNextMonth month1stDay={month1stDay} setMonth={setMonth} />
      </div>
      <div
        key="days"
        className="
          grid [grid-template-columns:repeat(7,2em)] gap-1
          p-2 width-fit
        "
      >
        {daysArray?.map((d, key) => (
          <DayCell
            key={key}
            exists={d.exists}
            dayStr={d.dayStr}
            dayNum={d.dayNum}
            currentPage={d.currentPage}
          />
        ))}
      </div>
    </div>
  );
}

function getDateFromPathname(pathname: string): string | undefined {
  if (!pathname) return undefined;

  const match = pathname.match(/\/pages\/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : undefined;
}

function MoveToPrevMonth({
  month1stDay,
  setMonth,
}: {
  month1stDay: StadenDate;
  setMonth: (month: string) => void;
}) {
  const goToPrevMonth = () => {
    const prevMonth = month1stDay.add(-1, "month");
    setMonth(prevMonth.format("YYYY-MM"));
  };

  return <MoveButton onClick={goToPrevMonth} content="←" />;
}

function MoveToNextMonth({
  month1stDay,
  setMonth,
}: {
  month1stDay: StadenDate;
  setMonth: (month: string) => void;
}) {
  const goToNextMonth = () => {
    const nextMonth = month1stDay.add(1, "month");
    setMonth(nextMonth.format("YYYY-MM"));
  };

  return <MoveButton onClick={goToNextMonth} content="→" />;
}

function MoveButton({
  onClick,
  content,
}: {
  onClick: () => void;
  content: string;
}): JSX.Element {
  return (
    <div
      className="
        flex
        w-6 h-6
        items-center justify-center
        rounded-full
        bg-primary/10
        hover:bg-primary/30
      "
      onClick={onClick}
    >
      {content}
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function
function DayCell({
  exists,
  dayStr,
  dayNum,
  currentPage,
}: {
  exists: boolean | undefined;
  dayStr: string | undefined;
  dayNum: number | null;
  currentPage: boolean | undefined;
}) {
  const { navigateToPage } = usePageNavigation();
  const href = `/pages/${dayStr}`;
  return (
    <div
      className="
        text-right px-2 m-px
        w-8
        data-exists:bg-primary/10 data-exists:rounded-lg
        data-current:border-1
      "
      data-exists={exists}
      data-current={currentPage || undefined}
    >
      {exists ? (
        <a
          href={href}
          className="
            text-link no-underline
          "
          onClick={(event) => {
            event.preventDefault();
            navigateToPage(href);
          }}
        >
          {dayNum}
        </a>
      ) : (
        dayNum || ""
      )}
    </div>
  );
}
