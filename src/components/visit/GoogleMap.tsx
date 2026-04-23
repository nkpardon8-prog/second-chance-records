export default function GoogleMap() {
  return (
    <div className="border-2 border-base rounded-sm overflow-hidden w-full aspect-video">
      <iframe
        title="Second Chance Records location"
        src="https://www.google.com/maps?q=5744+E+Burnside+St+Portland+OR+97215&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
