"use client";

import React from "react";
import { FiUser } from "react-icons/fi";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";

const data = [
  {
    name: "Jan",
    Returning: 275,
    New: 41,
  },
  {
    name: "Feb",
    Returning: 620,
    New: 96,
  },
  {
    name: "Mar",
    Returning: 202,
    New: 192,
  },
  {
    name: "Apr",
    Returning: 500,
    New: 50,
  },
  {
    name: "May",
    Returning: 355,
    New: 400,
  },
  {
    name: "Jun",
    Returning: 875,
    New: 200,
  },
  {
    name: "Jul",
    Returning: 700,
    New: 205,
  },
];

export const ActivityGraph = () => {
  return (
    <div className="col-span-8 overflow-hidden rounded border border-divider bg-content1">
      <div className="p-4">
        <h3 className="flex items-center gap-1.5 font-medium text-foreground">
          <FiUser /> Activity
        </h3>
      </div>

      <div className="h-64 px-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            width={500}
            height={400}
            data={data}
            margin={{
              top: 0,
              right: 0,
              left: -24,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-divider" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "currentColor" }}
              className="text-default-500"
              padding={{ right: 4 }}
            />
            <YAxis
              tick={{ fill: "currentColor" }}
              className="text-default-500"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--nextui-background)",
                border: "1px solid var(--nextui-divider)",
                borderRadius: "8px",
              }}
              itemStyle={{
                color: "var(--nextui-foreground)",
              }}
              labelStyle={{
                color: "var(--nextui-default-500)",
              }}
            />
            <Line
              type="monotone"
              dataKey="New"
              className="stroke-primary"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Returning"
              className="stroke-secondary"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
