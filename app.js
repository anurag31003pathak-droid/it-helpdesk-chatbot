const runButton = document.getElementById("run");
const queryInput = document.getElementById("query");
const output = document.getElementById("output");

async function runQuery() {
  const query = queryInput.value.trim();
  if (!query) return;
  output.innerHTML = `<div class="output-title">Response</div><p class="muted">Working...</p>`;

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const data = await res.json();

    output.innerHTML = `
      <div class="output-title">Response</div>
      <p><strong>Compressed Guidance</strong></p>
      <p>${data.compressedGuidance}</p>
      <p class="muted">${data.similarTickets.length} similar tickets · Avg resolve ${data.avgMinutesToResolve || "n/a"} min · Confidence ${data.confidence}</p>
      <p><strong>Recommended:</strong> ${data.recommendedAction}</p>
    `;
  } catch (err) {
    output.innerHTML = `<div class="output-title">Response</div><p class="muted">Error contacting server.</p>`;
  }
}

runButton.addEventListener("click", runQuery);
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runQuery();
});
