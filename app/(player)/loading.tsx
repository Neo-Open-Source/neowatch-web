export default function PlayerLoading() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`@keyframes nw-load-spin{to{transform:rotate(360deg)}}`}</style>
      <div
        style={{
          width: 46,
          height: 46,
          border: "3px solid rgba(255,255,255,0.18)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "nw-load-spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
