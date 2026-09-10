export const GlassCard = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-xl rounded-3xl p-5 md:p-8 w-full max-w-md mx-auto ${className}`}
  >
    {children}
  </div>
);