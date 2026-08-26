import {
  Circle,
  Document,
  Font,
  Line,
  Page,
  Polyline,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import path from "node:path";

import { periodLabel } from "@/features/reporting/insights";
import {
  planCompletion,
  reportTitle,
  type ReportView,
} from "@/features/reporting/reports";
import { formatTicketNumber } from "@/shared/ticket-number";

Font.register({
  family: "DM Sans",
  fonts: [
    {
      fontWeight: 400,
      src: path.join(process.cwd(), "public/fonts/DMSans-Regular.ttf"),
    },
    {
      fontWeight: 700,
      src: path.join(process.cwd(), "public/fonts/DMSans-Bold.ttf"),
    },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const color = {
  blush: "#f8e6e6",
  blushStrong: "#f0d3d6",
  border: "#ddd7df",
  ink: "#403a44",
  lavender: "#f6f3f8",
  lavenderStrong: "#c4b8d6",
  muted: "#756e79",
  paper: "#fffefc",
  quiet: "#96909a",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: color.paper,
    color: color.ink,
    fontFamily: "DM Sans",
    fontSize: 9,
    paddingBottom: 50,
    paddingHorizontal: 42,
    paddingTop: 34,
  },
  topRule: {
    backgroundColor: color.blushStrong,
    height: 4,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  header: {
    alignItems: "center",
    borderBottomColor: color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  brand: { fontSize: 15, fontWeight: 700 },
  privateLabel: {
    color: color.muted,
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  titleRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },
  title: { fontSize: 24, fontWeight: 700, letterSpacing: -0.7 },
  date: { color: color.muted, fontSize: 9, marginTop: 6 },
  schedule: { color: color.muted, fontSize: 8, textAlign: "right" },
  metrics: { flexDirection: "row", gap: 10, marginTop: 24 },
  metric: { borderRadius: 6, flexGrow: 1, padding: 13 },
  metricLavender: { backgroundColor: color.lavender },
  metricBlush: { backgroundColor: color.blush },
  eyebrow: {
    color: color.muted,
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },
  metricValue: { fontSize: 20, fontWeight: 700, marginTop: 8 },
  metricDetail: { color: color.muted, fontSize: 7, marginTop: 4 },
  analysis: { flexDirection: "row", gap: 24, marginTop: 24 },
  trend: { flexGrow: 1, width: "64%" },
  status: {
    borderLeftColor: color.border,
    borderLeftWidth: 1,
    paddingLeft: 24,
    width: "36%",
  },
  sectionTitle: { fontSize: 12, fontWeight: 700 },
  sectionDescription: { color: color.muted, fontSize: 8, marginTop: 5 },
  bars: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: "center",
    flexGrow: 1,
  },
  barPlot: {
    alignItems: "flex-end",
    borderBottomColor: color.border,
    borderBottomWidth: 1,
    height: 102,
    justifyContent: "flex-end",
    width: "100%",
  },
  barPair: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
  },
  workedBar: { backgroundColor: color.lavenderStrong },
  resolvedBar: { backgroundColor: color.blushStrong },
  barLabel: {
    color: color.muted,
    fontSize: 6.5,
    fontWeight: 700,
    marginTop: 5,
  },
  barTotals: { gap: 2, marginTop: 4 },
  barTotalRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    justifyContent: "center",
  },
  barTotalSwatch: { height: 5, width: 5 },
  barTotalText: { color: color.muted, fontSize: 6 },
  legend: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  legendSwatch: { height: 7, width: 7 },
  legendText: { color: color.muted, fontSize: 7 },
  statusRow: {
    borderBottomColor: color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11,
  },
  statusLabel: { color: color.muted, fontSize: 8 },
  statusValue: { fontSize: 9, fontWeight: 700 },
  narrative: {
    backgroundColor: color.lavender,
    borderRadius: 6,
    marginTop: 22,
    padding: 14,
  },
  narrativeTitle: { fontSize: 10, fontWeight: 700 },
  narrativeLine: { color: color.muted, fontSize: 8, marginTop: 7 },
  detailSection: { marginTop: 22 },
  detailRow: {
    borderBottomColor: color.border,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  detailTitle: { fontSize: 8, fontWeight: 700 },
  detailMeta: { color: color.muted, fontSize: 7, marginTop: 3 },
  emptyDetail: {
    backgroundColor: color.lavender,
    borderRadius: 5,
    color: color.muted,
    fontSize: 7,
    marginTop: 8,
    padding: 10,
  },
  note: {
    backgroundColor: color.blush,
    borderRadius: 5,
    marginTop: 8,
    padding: 10,
  },
  noteBullet: { color: color.muted, fontSize: 7, width: 8 },
  noteBulletRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 3,
  },
  footer: {
    borderTopColor: color.border,
    borderTopWidth: 1,
    bottom: 22,
    flexDirection: "row",
    fontSize: 6.5,
    justifyContent: "space-between",
    left: 42,
    paddingTop: 9,
    position: "absolute",
    right: 42,
  },
  footerText: { color: color.muted },
});

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function weekday(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
  }).format(new Date(`${value}T12:00:00Z`));
}

function localTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, 0, 1, hours, minutes)));
}

function notResolvedPlannedTickets({
  plannedTickets,
  ticketsResolved,
}: {
  plannedTickets: number;
  ticketsResolved: number;
}) {
  return Math.max(0, plannedTickets - ticketsResolved);
}

function noteLines(body: string) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function generatedLabel(report: ReportView) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: report.timeZone,
  }).format(new Date(report.generatedAt));
}

function Metric({
  blush = false,
  detail,
  label,
  value,
}: {
  blush?: boolean;
  detail?: string;
  label: string;
  value: string | number;
}) {
  return (
    <View
      style={[
        styles.metric,
        blush ? styles.metricBlush : styles.metricLavender,
      ]}
    >
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {detail ? <Text style={styles.metricDetail}>{detail}</Text> : null}
    </View>
  );
}

function ResolutionOutcomeBars({ report }: { report: ReportView }) {
  const max = Math.max(
    1,
    ...report.daily.flatMap((day) => [
      day.ticketsResolved,
      notResolvedPlannedTickets(day),
    ]),
  );
  return (
    <>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.resolvedBar]} />
          <Text style={styles.legendText}>Resolved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, styles.workedBar]} />
          <Text style={styles.legendText}>Not resolved</Text>
        </View>
      </View>
      <View style={styles.bars}>
        {report.daily.map((day) => {
          const notResolved = notResolvedPlannedTickets(day);
          const resolvedHeight = day.ticketsResolved
            ? Math.max(10, (day.ticketsResolved / max) * 90)
            : 2;
          const notResolvedHeight = notResolved
            ? Math.max(10, (notResolved / max) * 90)
            : 2;
          return (
            <View key={day.workDate} style={styles.barColumn}>
              <View style={styles.barPlot}>
                <View style={styles.barPair}>
                  <View
                    style={[
                      styles.resolvedBar,
                      { height: resolvedHeight, width: 11 },
                    ]}
                  />
                  <View
                    style={[
                      styles.workedBar,
                      { height: notResolvedHeight, width: 11 },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barLabel}>{weekday(day.workDate)}</Text>
              <View style={styles.barTotals}>
                <View style={styles.barTotalRow}>
                  <View style={[styles.barTotalSwatch, styles.resolvedBar]} />
                  <Text style={styles.barTotalText}>{day.ticketsResolved}</Text>
                </View>
                <View style={styles.barTotalRow}>
                  <View style={[styles.barTotalSwatch, styles.workedBar]} />
                  <Text style={styles.barTotalText}>{notResolved}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function InventoryTrend({ report }: { report: ReportView }) {
  const values = report.inventory;
  const max = Math.max(1, ...values.map((row) => row.activeTickets));
  const points = values.map((row, index) => {
    const x = values.length === 1 ? 140 : (index / (values.length - 1)) * 280;
    const y = 92 - (row.activeTickets / max) * 78;
    return `${x},${y}`;
  });
  return (
    <>
      <Svg height="110" width="100%" viewBox="0 0 280 110">
        <Line
          x1="0"
          y1="92"
          x2="280"
          y2="92"
          stroke={color.border}
          strokeWidth="1"
        />
        <Line
          x1="0"
          y1="52"
          x2="280"
          y2="52"
          stroke={color.border}
          strokeWidth="1"
        />
        <Polyline
          points={points.join(" ")}
          fill="none"
          stroke={color.lavenderStrong}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.map((point, index) => {
          const [cx, cy] = point.split(",").map(Number);
          return (
            <Circle
              key={values[index].workDate}
              cx={cx}
              cy={cy}
              r="3"
              fill={color.blushStrong}
            />
          );
        })}
      </Svg>
      <Text style={styles.sectionDescription}>
        Active inventory moved from {values[0]?.activeTickets ?? 0} to{" "}
        {values.at(-1)?.activeTickets ?? 0} tickets.
      </Text>
    </>
  );
}

function DailyOutcome({ report }: { report: ReportView }) {
  const values = [
    ["Resolved", report.totals.ticketsResolved],
    ["Closed", report.totals.ticketsClosed],
    ["Meetings attended", report.totals.meetingsAttended],
    [
      "Tasks and reminders",
      report.totals.tasksCompleted + report.totals.remindersCompleted,
    ],
    ["Follow-up decisions", report.followUpDecisions],
  ] as const;
  return (
    <View style={{ marginTop: 12 }}>
      {values.map(([label, value]) => (
        <View key={label} style={styles.statusRow}>
          <Text style={styles.statusLabel}>{label}</Text>
          <Text style={styles.statusValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyDetail({ children }: { children: string }) {
  return <Text style={styles.emptyDetail}>{children}</Text>;
}

export function ReportPdfDocument({ report }: { report: ReportView }) {
  const completion = planCompletion(report.totals);
  const detailsIncluded =
    report.config.includeTaskDetails ||
    report.config.includeTicketDetails ||
    report.config.includeDayNotes ||
    report.config.includeFollowUpReasons;
  const statusHeading =
    report.config.period === "weekly"
      ? "End-of-week status"
      : report.config.period === "monthly"
        ? "End-of-month status"
        : "End-of-day status";

  return (
    <Document
      author="North Haven"
      subject="Private work summary"
      title={reportTitle(report.config.period)}
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.topRule} fixed />
        <View style={styles.header}>
          <Text style={styles.brand}>North Haven</Text>
          <Text style={styles.privateLabel}>Private work summary</Text>
        </View>

        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>
              {reportTitle(report.config.period)}
            </Text>
            <Text style={styles.date}>
              {periodLabel(report.start, report.end)}
              {report.isPartial ? ` · Through ${shortDate(report.end)}` : ""}
            </Text>
          </View>
          <Text style={styles.schedule}>
            {localTime(report.schedule.startsAtLocal)}–
            {localTime(report.schedule.endsAtLocal)}
          </Text>
        </View>

        {report.config.includeSummaryMetrics ? (
          <View style={styles.metrics} wrap={false}>
            <Metric
              label="Tickets resolved"
              value={report.totals.ticketsResolved}
            />
            <Metric blush label="Pending" value={report.workStatus.pending} />
            <Metric label="Closed" value={report.totals.ticketsClosed} />
            <Metric
              blush
              label="Plan completion"
              value={completion === null ? "—" : `${completion}%`}
            />
          </View>
        ) : null}

        {report.config.includeTrend || report.config.includeStatus ? (
          <View style={styles.analysis} wrap={false}>
            {report.config.includeTrend ? (
              <View style={styles.trend}>
                <Text style={styles.sectionTitle}>
                  {report.config.period === "daily"
                    ? "Day outcome"
                    : report.config.period === "monthly"
                      ? "Active inventory trend"
                      : "Resolution outcome by day"}
                </Text>
                <Text style={styles.sectionDescription}>
                  {report.config.period === "monthly"
                    ? "Active tickets across the report period"
                    : report.config.period === "daily"
                      ? "Tickets with confirmed work activity"
                      : "Planned tickets resolved vs still open"}
                </Text>
                {report.config.period === "daily" ? (
                  <DailyOutcome report={report} />
                ) : report.config.period === "monthly" ? (
                  <InventoryTrend report={report} />
                ) : (
                  <ResolutionOutcomeBars report={report} />
                )}
              </View>
            ) : null}
            {report.config.includeStatus ? (
              <View style={styles.status}>
                <Text style={styles.sectionTitle}>{statusHeading}</Text>
                <Text style={styles.sectionDescription}>
                  Operational status on {shortDate(report.end)}
                </Text>
                {[
                  ...(report.config.period === "monthly"
                    ? [
                        [
                          "Tickets received",
                          report.inventory.reduce(
                            (sum, row) => sum + row.ticketsReceived,
                            0,
                          ),
                        ],
                      ]
                    : []),
                  ["Pending", report.workStatus.pending],
                  ["In progress", report.workStatus.inProgress],
                  ["Waiting for Response", report.workStatus.waiting],
                  ["Resolved", report.workStatus.resolved],
                  ["Follow-up reviews due next week", report.followUpDueCount],
                ].map(([label, value]) => (
                  <View key={label} style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{label}</Text>
                    <Text style={styles.statusValue}>{value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {report.config.includeNarrative ? (
          <View style={styles.narrative} wrap={false}>
            <Text style={styles.narrativeTitle}>
              {report.config.period === "daily"
                ? "Day in brief"
                : report.config.period === "weekly"
                  ? "Week in brief"
                  : "Month in brief"}
            </Text>
            {report.narrative.map((line) => (
              <Text key={line} style={styles.narrativeLine}>
                {line}
              </Text>
            ))}
            <Text style={styles.narrativeLine}>
              Customer details and work titles are{" "}
              {detailsIncluded
                ? "included where selected"
                : "excluded from this report"}
              .
            </Text>
          </View>
        ) : null}

        {report.config.includeTicketDetails ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Tickets worked</Text>
            {report.ticketDetails.length ? (
              report.ticketDetails.map((ticket) => (
                <View
                  key={ticket.workItemId}
                  style={styles.detailRow}
                  wrap={false}
                >
                  <Text style={styles.detailTitle}>
                    {formatTicketNumber(ticket.ticketNumber)} · {ticket.title}
                  </Text>
                  {report.config.period === "daily" ? null : (
                    <Text style={styles.detailMeta}>
                      Worked {ticket.workDates.map(shortDate).join(", ")}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <EmptyDetail>
                No ticket numbers or titles matched this report period.
              </EmptyDetail>
            )}
          </View>
        ) : null}

        {report.config.includeTaskDetails ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Tasks worked</Text>
            {report.taskDetails.length ? (
              report.taskDetails.map((task) => (
                <View
                  key={task.workItemId}
                  style={styles.detailRow}
                  wrap={false}
                >
                  <Text style={styles.detailTitle}>Task · {task.title}</Text>
                  {report.config.period === "daily" ? null : (
                    <Text style={styles.detailMeta}>
                      Worked {task.workDates.map(shortDate).join(", ")}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <EmptyDetail>
                No task titles matched this report period.
              </EmptyDetail>
            )}
          </View>
        ) : null}

        {report.config.includeDayNotes ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Day notes</Text>
            {report.dayNotes.length ? (
              report.dayNotes.map((note) => (
                <View key={note.workDate} style={styles.note} wrap={false}>
                  <Text style={styles.detailTitle}>
                    {shortDate(note.workDate)}
                    {note.isImportant ? " · Important" : ""}
                  </Text>
                  {noteLines(note.body).length > 1 ? (
                    noteLines(note.body).map((line, index) => (
                      <View
                        key={`${note.workDate}-${index}`}
                        style={styles.noteBulletRow}
                      >
                        <Text style={styles.noteBullet}>•</Text>
                        <Text style={styles.detailMeta}>{line}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.detailMeta}>{note.body}</Text>
                  )}
                </View>
              ))
            ) : (
              <EmptyDetail>
                No day notes were recorded for this period.
              </EmptyDetail>
            )}
          </View>
        ) : null}

        {report.config.includeFollowUpReasons ? (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Upcoming follow-ups</Text>
            {report.followUps.length ? (
              report.followUps.map((followUp, index) => (
                <View
                  key={`${followUp.reviewOn}-${index}`}
                  style={styles.detailRow}
                  wrap={false}
                >
                  <Text style={styles.detailTitle}>
                    {followUp.ticketNumber
                      ? `${formatTicketNumber(followUp.ticketNumber)} · `
                      : ""}
                    {followUp.title}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Review {shortDate(followUp.reviewOn)} · {followUp.reason}
                    {followUp.waitingOn
                      ? ` · Waiting on ${followUp.waitingOn}`
                      : ""}
                  </Text>
                </View>
              ))
            ) : (
              <EmptyDetail>
                No follow-up reviews are due in the next workweek.
              </EmptyDetail>
            )}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated {generatedLabel(report)} · {report.timeZone} ·{" "}
            {detailsIncluded
              ? "Selected details included"
              : "Customer details excluded"}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `North Haven · ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
