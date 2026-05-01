interface Props {
  text: string;
  className?: string;
}

export default function ProseContent({ text, className }: Props) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Any run of newlines = paragraph break. Tasha types single \n on Mission and
  // multiple \n's on About; both are intended as paragraph breaks. Splitting on
  // \n+ collapses both shapes into <p> boundaries.
  const paragraphs = trimmed.split(/\n+/).filter((p) => p.trim() !== "");

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </>
  );
}
