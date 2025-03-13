"use client";

import React from "react";
import { FiEye } from "react-icons/fi";
import {
  Radar,
  RadarChart,
  PolarGrid,
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const data = [
  {
    feature: "Tracking",
    mobile: 15,
    desktop: 110,
    max: 150,
  },
  {
    feature: "Builder",
    mobile: 130,
    desktop: 90,
    max: 150,
  },
  {
    feature: "Schedule",
    mobile: 86,
    desktop: 130,
    max: 150,
  },
  {
    feature: "AI Train",
    mobile: 125,
    desktop: 40,
    max: 150,
  },
  {
    feature: "Interval",
    mobile: 148,
    desktop: 90,
    max: 150,
  },
];

export const UsageRadar = () => {
  return (
    <div className="col-span-4 overflow-hidden rounded border border-divider bg-content1">
      <div className="p-4">
        <h3 className="flex items-center gap-1.5 font-medium text-foreground">
          <FiEye /> Usage
        </h3>
      </div>

      <div className="h-64 px-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid className="stroke-divider" />
            <PolarAngleAxis
              dataKey="feature"
              tick={{ fill: "currentColor" }}
              className="text-default-500"
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 150]}
              tick={{ fill: "currentColor" }}
              className="text-default-500"
            />
            <Radar
              name="Mobile"
              dataKey="mobile"
              className="stroke-primary fill-primary/20"
            />
            <Radar
              name="Desktop"
              dataKey="desktop"
              className="stroke-secondary fill-secondary/20"
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
            <Legend className="text-default-500" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
