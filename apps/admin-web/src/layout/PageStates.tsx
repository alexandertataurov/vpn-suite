import { EmptyState, ErrorState, Skeleton } from "@/design-system/primitives";
import { PageLayout } from "./PageLayout";

interface PageStateBaseProps {
  title: string;
  pageClass?: string;
  dataTestId?: string;
}

interface PageLoadingProps extends PageStateBaseProps {
  titleWidth?: number | string;
  bodyHeight?: number;
}

export function PageLoadingState({
  title,
  pageClass = "",
  dataTestId,
  titleWidth = "30%",
  bodyHeight = 200,
}: PageLoadingProps) {
  return (
    <PageLayout title={title} pageClass={pageClass} dataTestId={dataTestId} hideHeader>
      <Skeleton height={32} width={titleWidth} />
      <Skeleton height={bodyHeight} />
    </PageLayout>
  );
}

interface PageErrorProps extends PageStateBaseProps {
  message: string;
  onRetry?: () => void;
}

export function PageErrorState({ title, pageClass = "", dataTestId, message, onRetry }: PageErrorProps) {
  return (
    <PageLayout title={title} pageClass={pageClass} dataTestId={dataTestId} hideHeader>
      <ErrorState message={message} onRetry={onRetry} />
    </PageLayout>
  );
}

interface PageEmptyProps extends PageStateBaseProps {
  message: string;
}

export function PageEmptyState({ title, pageClass = "", dataTestId, message }: PageEmptyProps) {
  return (
    <PageLayout title={title} pageClass={pageClass} dataTestId={dataTestId}>
      <EmptyState message={message} />
    </PageLayout>
  );
}
