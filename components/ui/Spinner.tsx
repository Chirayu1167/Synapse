import { ReactNode } from "react";

export default function Spinner({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-[24px] w-[24px] items-center justify-center">
      <div className="h-[24px] w-[24px] rounded-border border-2 border-solid border-on-surface-variant/20 border-t-primary/60 animate-spin"></div>
    </div>
  );
}