import { Suspense } from "react";
import SuccessContent from "./SuccessContent";

const SuccessPage = () => (
  <Suspense
    fallback={
      <p className="min-h-[calc(100vh-6rem)] flex items-center justify-center" role="status">
        Confirming your payment...
      </p>
    }
  >
    <SuccessContent />
  </Suspense>
);

export default SuccessPage;
