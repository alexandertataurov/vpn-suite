import { BootScreen } from "@/design-system";
import { BootstrapSkeleton } from "./BootstrapSkeleton";

export function BootstrapLoading() {
  return (
    <BootScreen iconState="default" showProgress>
      <BootstrapSkeleton />
    </BootScreen>
  );
}
