/* ===================================================================
   gallery-page.js — thu-vien-anh.html (full photo gallery page)
=================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  await window.dbReady;
  const settings = db.settings.get();
  initCommonUI(settings);

  const { items, isFallback } = getGalleryItems(settings);
  const grid = document.getElementById("gallery-grid-full");
  const note = document.getElementById("gallery-fallback-note-full");

  note.style.display = isFallback ? "block" : "none";
  grid.innerHTML = items.map((item, index) => galleryCardHtml(item, isFallback, index)).join("");
  attachGalleryLightbox(grid, items, isFallback);
});
