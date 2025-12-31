import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  backLabel?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  backLink, 
  backLabel = "Back to Dashboard",
  icon,
  action 
}: PageHeaderProps) => {
  return (
    <div className="mb-8">
      {backLink && (
        <Link 
          href={backLink} 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {icon && (
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground break-words">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="w-full sm:w-auto">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
