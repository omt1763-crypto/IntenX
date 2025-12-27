import { ReactNode } from "react";
import DashboardCard from "./DashboardCard";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: ReactNode;
  gradient?: "pink" | "blue" | "yellow" | "purple" | "none";
  chart?: ReactNode;
}

const StatCard = ({ label, value, sublabel, icon, gradient = "none", chart }: StatCardProps) => {
  return (
    <DashboardCard gradient={gradient} hover>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-4xl font-bold text-foreground">{value}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
        </div>
        {chart && <div className="flex-shrink-0">{chart}</div>}
      </div>
    </DashboardCard>
  );
};

export default StatCard;
