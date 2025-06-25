"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/components/main-layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { apiGet } from "@/lib/api";

export default function ChartsPage() {
  const [open, setOpen] = useState(false);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [schemasError, setSchemasError] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [columns, setColumns] = useState<{ name: string; data_type: string }[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsError, setColumnsError] = useState<string | null>(null);
  const [xAxis, setXAxis] = useState<string | null>(null);
  const [yAxis, setYAxis] = useState<string | null>(null);

  const [chartName, setChartName] = useState("");
  const [chartDescription, setChartDescription] = useState("");
  const [search, setSearch] = useState("");
  const [createdChart, setCreatedChart] = useState<any | null>(null);

  const [tableData, setTableData] = useState<any[]>([]);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [tableDataError, setTableDataError] = useState<string | null>(null);

  // Fetch schemas when dialog opens
  useEffect(() => {
    if (open) {
      setSchemasLoading(true);
      setSchemasError(null);
      apiGet("/api/warehouse/schemas")
        .then((data) => setSchemas(data))
        .catch((err) => setSchemasError(err.message))
        .finally(() => setSchemasLoading(false));
    }
  }, [open]);

  // Fetch tables when schema changes
  useEffect(() => {
    if (selectedSchema) {
      setTablesLoading(true);
      setTablesError(null);
      setTables([]);
      setSelectedTable(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      setTableData([]);
      apiGet(`/api/warehouse/tables/${selectedSchema}`)
        .then((data) => setTables(data))
        .catch((err) => setTablesError(err.message))
        .finally(() => setTablesLoading(false));
    } else {
      setTables([]);
      setSelectedTable(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      setTableData([]);
    }
  }, [selectedSchema]);

  // Fetch columns when schema and table change
  useEffect(() => {
    if (selectedSchema && selectedTable) {
      setColumnsLoading(true);
      setColumnsError(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      setTableData([]);
      apiGet(`/api/warehouse/table_columns/${selectedSchema}/${selectedTable}`)
        .then((data) => setColumns(data))
        .catch((err) => setColumnsError(err.message))
        .finally(() => setColumnsLoading(false));
    } else {
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      setTableData([]);
    }
  }, [selectedSchema, selectedTable]);

  // Fetch table data when all inputs are set and chart is created
  useEffect(() => {
    if (createdChart) {
      setTableDataLoading(true);
      setTableDataError(null);
      setTableData([]);
      apiGet(`/api/warehouse/table_data/${createdChart.schema}/${createdChart.table}`)
        .then((data) => setTableData(data))
        .catch((err) => setTableDataError(err.message))
        .finally(() => setTableDataLoading(false));
    }
  }, [createdChart]);

  function handleSchemaChange(value: string) {
    setSelectedSchema(value);
  }

  function handleTableChange(value: string) {
    setSelectedTable(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedSchema && selectedTable && xAxis && yAxis && chartName) {
      setCreatedChart({
        schema: selectedSchema,
        table: selectedTable,
        xAxis,
        yAxis,
        chartName,
        chartDescription,
      });
      setOpen(false);
      // Reset form fields
      setSelectedSchema(null);
      setSelectedTable(null);
      setXAxis(null);
      setYAxis(null);
      setChartName("");
      setChartDescription("");
      setSearch("");
    }
  }

  // Filtered tables for search
  const filteredTables = tables.filter((table) =>
    table.toLowerCase().includes(search.toLowerCase())
  );

  // Before mapping chartData, add a debug log
  console.log('tableData sample:', tableData[0], 'xAxis:', xAxis, 'yAxis:', yAxis);
  const chartData = (createdChart && createdChart.xAxis && createdChart.yAxis)
    ? tableData.map((row) => ({
        [createdChart.xAxis]: row?.[createdChart.xAxis],
        [createdChart.yAxis]: row?.[createdChart.yAxis],
      }))
    : [];

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Charts</h1>
          <Button onClick={() => setOpen(true)}>Add Chart</Button>
        </div>
        {/* Chart rendering */}
        {createdChart && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-1">{createdChart.chartName}</h2>
            <div className="text-muted-foreground mb-4">{createdChart.chartDescription}</div>
            {tableDataLoading ? (
              <div className="text-muted-foreground">Loading chart data...</div>
            ) : tableDataError ? (
              <div className="text-red-500">{tableDataError}</div>
            ) : (
              <>
                {!tableDataLoading && !tableDataError && chartData.every(obj => Object.keys(obj).length === 0) && (
                  <div className="text-red-500 mb-4">No data found for the selected columns. Please check your column selection or table data.</div>
                )}
                <BarChartComponent
                  data={chartData}
                  xKey={createdChart.xAxis}
                  yKey={createdChart.yAxis}
                />
              </>
            )}
          </div>
        )}
        {/* Placeholder for chart list if no chart created */}
        {!createdChart && <div className="text-muted-foreground mb-8">No charts created yet.</div>}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle>Add a Bar Chart</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Schema Picker */}
              <div>
                <label className="block mb-1 font-medium">Pick a Schema</label>
                <Select value={selectedSchema || undefined} onValueChange={handleSchemaChange} disabled={schemasLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={schemasLoading ? "Loading schemas..." : "Select a schema"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schemasError && <div className="px-3 py-2 text-red-500">{schemasError}</div>}
                    {schemas.map((schema) => (
                      <SelectItem key={schema} value={schema}>
                        {schema}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Table Picker */}
              <div>
                <label className="block mb-1 font-medium">Pick a Table</label>
                <Input
                  placeholder="Search tables..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-2"
                  disabled={!selectedSchema || tablesLoading}
                />
                <Select value={selectedTable || undefined} onValueChange={handleTableChange} disabled={!selectedSchema || tablesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select a table"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesError && <div className="px-3 py-2 text-red-500">{tablesError}</div>}
                    {filteredTables.length === 0 && !tablesLoading && (
                      <div className="px-3 py-2 text-muted-foreground">No tables found</div>
                    )}
                    {filteredTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* X Axis Picker */}
              <div>
                <label className="block mb-1 font-medium">X Axis Column</label>
                <Select value={xAxis || undefined} onValueChange={setXAxis} disabled={!selectedTable || columnsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={columnsLoading ? "Loading columns..." : "Select x axis column"} />
                  </SelectTrigger>
                  <SelectContent>
                    {columnsError && <div className="px-3 py-2 text-red-500">{columnsError}</div>}
                    {columns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} <span className="text-xs text-muted-foreground">({col.data_type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Y Axis Picker */}
              <div>
                <label className="block mb-1 font-medium">Y Axis Column</label>
                <Select value={yAxis || undefined} onValueChange={setYAxis} disabled={!selectedTable || columnsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={columnsLoading ? "Loading columns..." : "Select y axis column"} />
                  </SelectTrigger>
                  <SelectContent>
                    {columnsError && <div className="px-3 py-2 text-red-500">{columnsError}</div>}
                    {columns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} <span className="text-xs text-muted-foreground">({col.data_type})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Chart Name */}
              <div>
                <label className="block mb-1 font-medium">Chart Name</label>
                <Input
                  placeholder="Enter chart name"
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                />
              </div>
              {/* Chart Description */}
              <div>
                <label className="block mb-1 font-medium">Chart Description</label>
                <Textarea
                  placeholder="Enter chart description"
                  value={chartDescription}
                  onChange={(e) => setChartDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={!selectedSchema || !selectedTable || !xAxis || !yAxis || !chartName}>
                Create Chart
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

function BarChartComponent({ data, xKey, yKey }: { data: any[]; xKey: string; yKey: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={yKey} name={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 