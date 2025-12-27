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
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-flow-purple to-flow-blue flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
