document.getElementById("navigator-destinations-projects").addEventListener("click", () => {
  const target = document.getElementById("main-container2");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
