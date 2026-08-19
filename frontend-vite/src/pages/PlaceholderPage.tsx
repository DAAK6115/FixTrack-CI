export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="panel">
      <p className="eyebrow">FIXTRACK CI</p>
      <h2>{title}</h2>
      <p className="muted">
        Cette fonctionnalité sera implémentée dans les prochains Sprints.
      </p>
    </div>
  );
}
