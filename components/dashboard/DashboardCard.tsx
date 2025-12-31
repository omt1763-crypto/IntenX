import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "pink" | "blue" | "yellow" | "purple" | "none";
  hover?: boolean;
}

const gradientClasses = {
  pink: "bg-gradient-to-br from-flow-pink/50 via-card to-card",
  blue: "bg-gradient-to-br from-flow-blue/20 via-card to-card",
  yellow: "bg-gradient-to-br from-flow-yellow/30 via-card to-card",
  purple: "bg-gradient-to-br from-flow-purple/10 via-card to-card",
  none: "bg-card",
};

const DashboardCard = ({ 
  children, 
  className, 
  gradient = "none",
  hover = false 
}: DashboardCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg sm:rounded-2xl border border-border/50 p-4 sm:p-6 shadow-card",
        gradientClasses[gradient],
        hover && "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
};

export default DashboardCard;
