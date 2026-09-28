import type {
  AnalyticsBreakdown,
  AnalyticsCategory,
  AnalyticsTrendPoint,
} from "../types/analytics";


type BarListProps = {
  items:
    | AnalyticsBreakdown[]
    | AnalyticsCategory[];

  emptyLabel?: string;
};


export function BarList({
  items,
  emptyLabel = "Aucune donnée",
}: BarListProps) {
  const max = Math.max(
    1,
    ...items.map(
      (item) => item.count
    )
  );


  if (!items.length) {
    return (
      <div className="analytics-empty">
        {emptyLabel}
      </div>
    );
  }


  return (
    <div className="analytics-bars">
      {items.map(
        (item) => {
          const width = Math.max(
            5,
            Math.round(
              (
                item.count
                / max
              )
              * 100
            )
          );

          const key =
            "key" in item
              ? item.key
              : item.label;

          return (
            <div
              className="analytics-bar-row"
              key={key}
            >
              <div className="analytics-bar-label">
                <span>
                  {item.label}
                </span>

                <strong>
                  {item.count}
                </strong>
              </div>

              <div className="analytics-bar-track">
                <span
                  style={{
                    width:
                      `${width}%`,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}


type TrendChartProps = {
  points:
    AnalyticsTrendPoint[];
};


export function TrendChart({
  points,
}: TrendChartProps) {
  const width = 720;
  const height = 220;

  const paddingX = 38;
  const paddingY = 24;

  const chartWidth =
    width - paddingX * 2;

  const chartHeight =
    height - paddingY * 2;

  const maxValue = Math.max(
    1,
    ...points.flatMap(
      (point) => [
        point.reported,
        point.resolved,
      ]
    )
  );


  const coordinates = (
    key:
      | "reported"
      | "resolved"
  ) => {
    return points.map(
      (point, index) => {
        const denominator =
          Math.max(
            points.length - 1,
            1
          );

        const x =
          paddingX
          + (
              index
              / denominator
            )
            * chartWidth;

        const y =
          paddingY
          + chartHeight
          - (
              point[key]
              / maxValue
            )
            * chartHeight;

        return {
          x,
          y,
        };
      }
    );
  };


  const pathFor = (
    key:
      | "reported"
      | "resolved"
  ) => {
    return coordinates(key)
      .map(
        (
          point,
          index
        ) => (
          `${index === 0
            ? "M"
            : "L"
          } ${point.x} ${point.y}`
        )
      )
      .join(" ");
  };


  if (!points.length) {
    return (
      <div className="analytics-empty">
        Aucune donnée sur la période.
      </div>
    );
  }


  return (
    <div className="trend-chart-wrapper">

      <svg
        className="trend-chart"
        viewBox={
          `0 0 ${width} ${height}`
        }
        role="img"
        aria-label={
          "Tendance des incidents"
        }
      >
        <line
          x1={paddingX}
          y1={
            height - paddingY
          }
          x2={
            width - paddingX
          }
          y2={
            height - paddingY
          }
          className="trend-axis"
        />

        <path
          d={
            pathFor(
              "reported"
            )
          }
          className="trend-line trend-reported"
        />

        <path
          d={
            pathFor(
              "resolved"
            )
          }
          className="trend-line trend-resolved"
        />

        {coordinates(
          "reported"
        ).map(
          (
            point,
            index
          ) => (
            <circle
              key={
                `reported-${index}`
              }
              cx={point.x}
              cy={point.y}
              r="4"
              className="trend-dot trend-reported-dot"
            />
          )
        )}

        {coordinates(
          "resolved"
        ).map(
          (
            point,
            index
          ) => (
            <circle
              key={
                `resolved-${index}`
              }
              cx={point.x}
              cy={point.y}
              r="4"
              className="trend-dot trend-resolved-dot"
            />
          )
        )}
      </svg>


      <div className="trend-labels">
        {points.map(
          (point) => (
            <span
              key={point.date}
            >
              {point.label}
            </span>
          )
        )}
      </div>


      <div className="trend-legend">
        <span>
          <i className="legend-reported" />
          Signalés
        </span>

        <span>
          <i className="legend-resolved" />
          Résolus
        </span>
      </div>

    </div>
  );
}
