export default function VideoPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <video
        controls
        autoPlay
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <source src="/FT_KS 1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
