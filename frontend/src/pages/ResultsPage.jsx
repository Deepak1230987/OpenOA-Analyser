/**
 * ResultsPage
 * ===========
 * Dedicated route for analysis results.
 * Reads results from router location state; redirects to upload if missing.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import ResultsDashboard from "../components/ResultsDashboard";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, filename } = location.state || {};

  useEffect(() => {
    if (!results) {
      navigate("/", { replace: true });
    }
  }, [results, navigate]);

  if (!results) return null;

  const handleReset = () => navigate("/");

  return (
    <ResultsDashboard
      results={results}
      filename={filename}
      onReset={handleReset}
    />
  );
}
