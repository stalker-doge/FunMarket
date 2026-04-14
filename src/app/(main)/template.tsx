export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-pageIn motion-reduce:animate-none">
      {children}
    </div>
  );
}
