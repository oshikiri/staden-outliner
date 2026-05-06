import path from "node:path";

export function getRegexCaptureExtensionFilename(): string {
  switch (process.platform) {
    case "darwin":
      return "regex_capture.dylib";
    case "win32":
      return "regex_capture.dll";
    default:
      return "regex_capture.so";
  }
}

export function getRegexCaptureExtensionBasePath(): string {
  return path.resolve(process.cwd(), "dist/sqlite-regex-capture/regex_capture");
}

export function getRegexCaptureExtensionOutputPath(): string {
  return path.resolve(
    process.cwd(),
    "dist/sqlite-regex-capture",
    getRegexCaptureExtensionFilename(),
  );
}

export function getRegexCaptureExtensionSourcePath(): string {
  return path.resolve(
    process.cwd(),
    "native/sqlite-regex-capture/regex_capture.cpp",
  );
}
