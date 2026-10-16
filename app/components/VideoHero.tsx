"use client";

export default function VideoHero({
  videoSrc,
  posterSrc,
  eyebrow,
  title,
  description,
  cta,
}: {
  videoSrc: string;
  posterSrc?: string;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <section className="relative w-full min-h-[60vh] flex items-center overflow-hidden">
      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div
        aria-hidden
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* Blue glow */}
      <div
        aria-hidden
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20 w-full">
        <p className="text-xs tracking-[0.4em] text-white/50 uppercase mb-6">
          {eyebrow}
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.05] mb-6 text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] max-w-3xl">
          {title}
        </h1>
        <p className="text-base md:text-lg text-white/70 max-w-2xl leading-relaxed mb-8">
          {description}
        </p>
        {cta}
      </div>
    </section>
  );
}