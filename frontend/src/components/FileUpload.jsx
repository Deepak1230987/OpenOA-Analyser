/**
 * FileUpload Component
 * ====================
 * Drag-and-drop / click-to-upload zone for CSV files.
 * Also includes a "rated power" input and a "Try Sample Data" button.
 */

import { useState, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Upload,
  Zap,
  BarChart3,
  FileSpreadsheet,
  CheckCircle2,
} from "lucide-react";

export default function FileUpload({ onUpload, onSampleData }) {
  const [file, setFile] = useState(null);
  const [ratedPower, setRatedPower] = useState(2000);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  /* ---- Drag & Drop handlers ---- */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.toLowerCase().endsWith(".csv")) {
      setFile(dropped);
    }
  };

  /* ---- Click handler ---- */
  const handleClick = () => inputRef.current?.click();

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  /* ---- Submit ---- */
  const handleSubmit = () => {
    if (file) onUpload(file, ratedPower);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Drop zone card */}
      <Card>
        <CardContent className="p-0">
          <div
            className={`
              relative flex flex-col items-center justify-center gap-4
              rounded-xl border-2 border-dashed p-10
              cursor-pointer transition-all duration-200 ease-in-out
              ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : file
                    ? "border-success/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
          >
            {file ? (
              <>
                <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB &middot; Click or drop to
                    replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-muted text-muted-foreground rounded-full">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Drop your CSV file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse &middot; Max 50 MB
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <Badge variant="secondary">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    timestamp
                  </Badge>
                  <Badge variant="secondary">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    wind_speed
                  </Badge>
                  <Badge variant="secondary">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    power
                  </Badge>
                </div>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:w-64 space-y-2">
              <Label htmlFor="rated-power">Turbine Rated Power (kW)</Label>
              <Input
                id="rated-power"
                type="number"
                min={1}
                value={ratedPower}
                onChange={(e) => setRatedPower(Number(e.target.value))}
              />
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                disabled={!file}
                onClick={handleSubmit}
                className="flex-1 sm:flex-none"
              >
                <Zap className="h-4 w-4" />
                Analyze
              </Button>
              <Button
                variant="outline"
                onClick={() => onSampleData(ratedPower)}
                className="flex-1 sm:flex-none"
              >
                <BarChart3 className="h-4 w-4" />
                Try Sample Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: <Zap className="h-5 w-5 text-amber-500" />,
            title: "Power Curve",
            desc: "IEC 61400-12-1 binned analysis",
          },
          {
            icon: <BarChart3 className="h-5 w-5 text-sky-500" />,
            title: "Performance KPIs",
            desc: "Capacity factor, AEP, availability",
          },
          {
            icon: <FileSpreadsheet className="h-5 w-5 text-emerald-500" />,
            title: "Data Quality",
            desc: "Missing data & anomaly detection",
          },
        ].map((f) => (
          <Card key={f.title} className="text-center">
            <CardContent className="pt-6">
              <div className="flex justify-center mb-2">{f.icon}</div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
