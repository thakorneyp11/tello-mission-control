export default function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        background: [
          'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 15%)',
          'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 25%)',
          'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 20%)',
          'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
        ].join(', '),
      }}
    />
  );
}
