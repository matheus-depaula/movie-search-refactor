import { FC } from "react";

type Side = "left" | "right";

interface ChevronProps {
  side: Side;
  className?: string;
}

export const Chevron: FC<ChevronProps> = ({ side, className = '' }) => {
  const pathData: Record<Side, string> = {
    left: "M15 19l-7-7 7-7",
    right: "M9 5l7 7-7 7"
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pathData[side]} />
    </svg>
  )
};
