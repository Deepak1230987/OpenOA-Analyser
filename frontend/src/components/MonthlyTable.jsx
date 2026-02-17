/**
 * MonthlyTable Component
 * ======================
 * Tabular view of per-month statistics using shadcn Table.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { CalendarDays } from "lucide-react";

export default function MonthlyTable({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-rose-500" />
          <CardTitle className="text-base">Monthly Statistics</CardTitle>
        </div>
        <CardDescription>
          Performance breakdown by calendar month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Mean WS (m/s)</TableHead>
              <TableHead className="text-right">Mean Power (kW)</TableHead>
              <TableHead className="text-right">Max Power (kW)</TableHead>
              <TableHead className="text-right">Energy (MWh)</TableHead>
              <TableHead className="text-right">CF (%)</TableHead>
              <TableHead className="text-right">Avail. (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.month}>
                <TableCell className="font-semibold text-foreground">
                  {row.month}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.record_count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.mean_wind_speed}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.mean_power}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.max_power}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium text-foreground">
                  {row.energy_mwh}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.capacity_factor_pct}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.availability_pct}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
