interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const styles: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  info: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
};

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
