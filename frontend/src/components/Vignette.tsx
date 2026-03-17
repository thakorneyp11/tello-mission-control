export default function Vignette() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        background: [
          'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 18%)',
          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 28%)',
          'linear-gradient(to right, rgba(0,0,0,0.6) 0%, transparent 22%)',
          'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.4) 100%)',
        ].join(', '),
      }}
    />
  );
}
