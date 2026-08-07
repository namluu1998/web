/** Trả về true nếu giá trị là đường dẫn ảnh (không phải emoji văn bản) */
export function isImageValue(val: string): boolean {
  return val.startsWith("/uploads/") || val.startsWith("http://") || val.startsWith("https://");
}
