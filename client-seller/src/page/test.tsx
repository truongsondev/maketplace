export default function TestPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f0f0f0",
      }}
    >
      <div
        style={{
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#333", margin: 0 }}>✅ React đang hoạt động!</h1>
        <p style={{ color: "#666", marginTop: "1rem" }}>
          Test page - Nếu bạn thấy trang này, React Router đang hoạt động tốt.
        </p>
      </div>
    </div>
  );
}
