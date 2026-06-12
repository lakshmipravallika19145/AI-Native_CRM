import Link from "next/link";

type EmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "40px 24px" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
        background: "#f8f8f6", border: "1px solid #f0f0ee",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontSize: 13, color: "#aaa", margin: "0 0 20px", maxWidth: 320, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} style={{
          display: "inline-block", background: "#1a1a1a", color: "white",
          textDecoration: "none", padding: "10px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 600,
        }}>
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button onClick={onAction} style={{
          background: "#1a1a1a", color: "white", border: "none",
          padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          cursor: "pointer",
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
