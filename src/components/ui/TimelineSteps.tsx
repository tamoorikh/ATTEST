import React from "react";
import Link from "next/link";
import { StatusPill } from "./StatusPill";

export interface TimelineItem {
  number: number;
  title: string;
  subtitle: string;
  status: "done" | "current" | "upcoming";
}

interface TimelineStepsProps {
  items?: TimelineItem[];
  openQuestionsCount?: number;
  caSignerName?: string;
  certPublicId?: string;
  isIssued?: boolean;
  className?: string;
}

export function TimelineSteps({
  items,
  openQuestionsCount = 2,
  caSignerName = "Ayesha Siddiqui, FCA",
  certPublicId = "ATTEST-PK-2026-406434-0A",
  isIssued = false,
  className = "",
}: TimelineStepsProps) {
  const defaultItems: TimelineItem[] = [
    {
      number: 1,
      title: "Documents received",
      subtitle: "3 sources · sealed",
      status: "done",
    },
    {
      number: 2,
      title: "Numbers checked",
      subtitle: "arithmetic 100% ✓",
      status: "done",
    },
    {
      number: 3,
      title: "Questions answered",
      subtitle: openQuestionsCount > 0 ? "Waiting on you" : "Answered ✓",
      status: openQuestionsCount > 0 ? "current" : "done",
    },
    {
      number: 4,
      title: "CA signs",
      subtitle: isIssued ? "Signed ✓" : caSignerName,
      status: isIssued ? "done" : openQuestionsCount === 0 ? "current" : "upcoming",
    },
    {
      number: 5,
      title: "Live for banks",
      subtitle: isIssued ? "Live · verified ✓" : "public · no login",
      status: isIssued ? "current" : "upcoming",
    },
  ];

  const timelineItems = items || defaultItems;

  return (
    <div className={`p-4 sm:p-5 ${className}`}>
      <div className="space-y-0">
        {timelineItems.map((item, idx) => {
          const isDone = item.status === "done";
          const isCurrent = item.status === "current";
          const isLast = idx === timelineItems.length - 1;

          return (
            <div key={item.number} className="relative flex gap-3.5 pb-5 last:pb-0">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-[12px] top-[26px] bottom-0 w-[2px] ${
                    isDone
                      ? "bg-[#188A54]"
                      : isCurrent
                      ? "bg-[#DCD9F8]"
                      : "bg-[#F1EFE9]"
                  }`}
                />
              )}

              {/* Dot */}
              <div
                className={`w-[25px] h-[25px] rounded-full shrink-0 grid place-items-center text-[11px] font-extrabold z-10 transition-all ${
                  isDone
                    ? "bg-[#188A54] border-2 border-[#188A54] text-white"
                    : isCurrent
                    ? "bg-[#4F46E5] border-2 border-[#4F46E5] text-white shadow-[0_0_0_4px_#EEEDFB]"
                    : "bg-white border-2 border-[#E9E6DF] text-[#A8A296]"
                }`}
              >
                {isDone ? "✓" : item.number}
              </div>

              {/* Text */}
              <div className="min-w-0 pt-0.5">
                <div className="font-bold text-[13.5px] text-[#17161A]">
                  {item.title}
                </div>
                <div
                  className={`text-[11.5px] ${
                    isCurrent
                      ? "text-[#4F46E5] font-semibold"
                      : isDone
                      ? "text-[#6E6A61]"
                      : "text-[#A8A296]"
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Strip with Stamp and Link */}
      <div className="pt-4 mt-2 border-t border-[#F1EFE9]">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
          {isIssued ? (
            <span className="stamp animated font-heading font-extrabold text-[12px] text-[#188A54] border-2 border-[#188A54] rounded-[9px] px-2.5 py-0.5 bg-[#E7F5EE] -rotate-6">
              CA VERIFIED ✓
            </span>
          ) : (
            <span className="text-[11.5px] font-medium text-[#6E6A61]">
              Awaiting sign-off
            </span>
          )}

          <StatusPill
            status={isIssued ? "VALID" : "PENDING"}
            label={isIssued ? "VALID & LIVE" : "PENDING"}
            size="xs"
            variant={isIssued ? "green" : "gray"}
          />
        </div>

        <Link
          href={`/verify/${certPublicId}`}
          className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] hover:underline break-all inline-flex items-center gap-1 font-mono"
        >
          <span>attest.pk/verify/{certPublicId}</span>
          <span className="text-[11px]">↗</span>
        </Link>
      </div>
    </div>
  );
}

export default TimelineSteps;
