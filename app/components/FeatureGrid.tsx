export default function FeatureGrid({
  features,
}: {
  features: { icon: string; title: string; desc: string }[];
}) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {features.map((f) => (
        <div
          key={f.title}
          className="bg-zinc-950/60 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all group"
        >
          <span className="text-2xl block mb-4">{f.icon}</span>
          <h3 className="font-semibold mb-1.5 tracking-tight">{f.title}</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}