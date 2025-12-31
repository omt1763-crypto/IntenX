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
      <div className="flex items-start justify-between mb-4 gap-2">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground flex-1">{label}</p>
        {icon && <div className="flex-shrink-0">{icon}</div>}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{value}</p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
          )}
        </div>
        {chart && <div className="flex-shrink-0 w-full sm:w-auto">{chart}</div>}
      </div>
    </DashboardCard>
  );
};

export default StatCard;
