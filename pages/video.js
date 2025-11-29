export default function VideoPage() {
  return (
    <main
      className="flex justify-center p-10"
      aria-labelledby="video-page-heading"
    >
      <h1 id="video-page-heading" className="sr-only">
        ForgeTomorrow Intro Video
      </h1>

      <video
        controls
        autoPlay
        playsInline
        aria-label="ForgeTomorrow introduction video"
        style={{ maxWidth: "100%", height: "auto" }}
      >
        <source src="/FT_KS 1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </main>
  );
}
