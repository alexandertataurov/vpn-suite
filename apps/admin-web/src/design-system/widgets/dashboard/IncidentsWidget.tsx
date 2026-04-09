import type { IncidentsWidgetData } from "../widgets.types";
import { getIncidentsState } from "../widgets.types";
import { Widget } from "../../primitives/Widget";

interface IncidentsWidgetProps {
  data: IncidentsWidgetData;
  href?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function IncidentsWidget({ data, href, title, subtitle, className }: IncidentsWidgetProps) {
  const state = getIncidentsState(data);

  const headerTitle = title ?? "Incidents";
  const headerSub = subtitle ?? "live signals";

  const unhealthyNodes = data.unhealthyNodes ?? data.critical + data.warning;
  const criticalValClass = data.critical === 0 ? "z" : state === "critical" ? "c" : "z";
  const warningValClass = data.warning === 0 ? "z" : "w";
  const unhealthyValClass = unhealthyNodes === 0 ? "z" : state === "critical" ? "c" : "w";

  return (
    <Widget
      title={headerTitle}
      subtitle={headerSub}
      href={href}
      variant="kpi"
      edge="amber"
      headerRight={renderHeaderBadge(state, data)}
      size="medium"
      className={className}
    >
      <div className="inc-grid" aria-label="Incident summary">
        <div className="inc-cell">
          <div className="ic-lbl">Critical</div>
          <div className={cx("ic-val", criticalValClass)}>{data.critical}</div>
        </div>
        <div className="inc-cell">
          <div className="ic-lbl">Warning</div>
          <div className={cx("ic-val", warningValClass)}>{data.warning}</div>
        </div>
        <div className="inc-cell inc-cell--span2">
          <div className="ic-lbl">Unhealthy nodes</div>
          <div className={cx("ic-val", unhealthyValClass)}>{unhealthyNodes}</div>
        </div>
      </div>

      {renderIncidentNote(state, data)}
    </Widget>
  );
}

function renderHeaderBadge(state: ReturnType<typeof getIncidentsState>, data: IncidentsWidgetData) {
  if (state === "allClear") {
    return <span className="chip cg">0</span>;
  }
  if (state === "warnings") {
    return <span className="chip ca">{data.warning}</span>;
  }
  if (state === "critical") {
    return <span className="chip cr">{data.critical + data.warning}</span>;
  }
  return <span className="chip cb">ACK</span>;
}

function renderIncidentNote(
  state: ReturnType<typeof getIncidentsState>,
  _data: IncidentsWidgetData,
) {
  void _data;
  if (state === "allClear") {
    return (
      <p className="type-meta incidents-message">
        No active incidents reported.
      </p>
    );
  }

  if (state === "warnings") {
    return (
      <p className="type-meta chip ca incidents-message">
        ⚠ Active warnings
      </p>
    );
  }

  if (state === "critical") {
    return (
      <p className="type-meta chip cr text-danger incidents-message">
        ✕ Critical incidents in progress
      </p>
    );
  }

  return (
    <p className="type-meta incidents-message incidents-message--blue">
      → Acknowledged by operator
    </p>
  );
}
