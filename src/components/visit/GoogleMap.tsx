export default function GoogleMap() {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-[var(--color-primary)]/10">
      <iframe
        title="Second Chance Records location"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2795.5!2d-122.5536!3d45.5232!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDXCsDMxJzIzLjUiTiAxMjLCsDMzJzEyLjkiVw!5e0!3m2!1sen!2sus!4v1!5m2!1sen!2sus&q=5744+E+Burnside+St+Suite+104+Portland+OR+97215"
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
