import { Suspense } from "react";
import InterviewContent from "./InterviewContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading Interview...</div>}>
      <InterviewContent />
    </Suspense>
  );
}