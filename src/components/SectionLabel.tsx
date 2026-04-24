import clsx from "clsx";

export function SectionLabel({
  children,
  icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("tag-label", className)}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
