interface Props {
  text: string;
  className?: string;
}

export default function ProseContent({ text, className }: Props) {
  // Normalize CRLF (Windows/paste-from-Word) and lone CR before splitting so a
  // stray \r doesn't cling to the previous paragraph as invisible whitespace.
  const trimmed = text.replace(/\r\n?/g, "\n").trim();
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
