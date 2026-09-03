const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 5500;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
};

// Đường dẫn đẹp của trang chi tiết món: /mon/<slug> -> mon.html
// (trên production .htaccess rewrite sang mon.php, xem php-patch/).
function rewritePath(urlPath) {
  if (urlPath === "/") return "/index.html";
  if (/^\/mon\/[^/]+\/?$/.test(urlPath)) return "/mon.html";
  if (/^\/bai-viet\/[^/]+\/?$/.test(urlPath)) return "/bai-viet.html";
  return urlPath;
}

http.createServer((req, res) => {
  let urlPath = rewritePath(decodeURIComponent(req.url.split("?")[0]));
  let filePath = path.join(ROOT, urlPath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (!path.extname(filePath)) {
        filePath = path.join(ROOT, urlPath + ".html");
        fs.readFile(filePath, (err2, data2) => {
          if (err2) {
            fs.readFile(path.join(ROOT, "404.html"), (err3, data3) => {
              res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
              res.end(err3 ? "404 Not Found" : data3);
            });
            return;
          }
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(data2);
        });
        return;
      }
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
