#include <sqlite3ext.h>

#include <regex>
#include <iomanip>
#include <sstream>
#include <string>

SQLITE_EXTENSION_INIT1

namespace {

std::string serializeCaptures(const std::smatch& match);

/**
 * SQLite callback for regex_capture(text, pattern).
 */
void regexCapture(sqlite3_context* context, int argc, sqlite3_value** argv) {
  if (argc != 2) {
    sqlite3_result_error(context, "regex_capture expects 2 arguments", -1);
    return;
  }

  if (sqlite3_value_type(argv[0]) == SQLITE_NULL ||
      sqlite3_value_type(argv[1]) == SQLITE_NULL) {
    sqlite3_result_null(context);
    return;
  }

  const auto* text = reinterpret_cast<const char*>(sqlite3_value_text(argv[0]));
  const auto* pattern =
      reinterpret_cast<const char*>(sqlite3_value_text(argv[1]));

  try {
    const std::regex re(pattern, std::regex::ECMAScript);
    std::smatch match;
    const std::string input(text);
    if (!std::regex_search(input, match, re)) {
      sqlite3_result_null(context);
      return;
    }

    const std::string captures = serializeCaptures(match);
    sqlite3_result_text(context, captures.c_str(), -1, SQLITE_TRANSIENT);
  } catch (const std::regex_error& error) {
    sqlite3_result_error(context, error.what(), -1);
  } catch (...) {
    sqlite3_result_error(context, "regex_capture failed", -1);
  }
}

/**
 * Register regex_capture as a deterministic scalar function.
 */
extern "C" int sqlite3_regex_capture_init(
    sqlite3* db,
    char** pzErrMsg,
    const sqlite3_api_routines* pApi) {
  SQLITE_EXTENSION_INIT2(pApi);
  (void)pzErrMsg;
  const int rc = sqlite3_create_function_v2(
      db,
      "regex_capture",
      2,
      SQLITE_UTF8 | SQLITE_DETERMINISTIC,
      nullptr,
      regexCapture,
      nullptr,
      nullptr,
      nullptr);
  return rc;
}

/**
 * Escape a string so it can be embedded in a JSON string literal.
 */
std::string jsonEscape(const std::string& value) {
  std::ostringstream out;
  for (char ch : value) {
    switch (ch) {
      case '\\':
        out << "\\\\";
        break;
      case '"':
        out << "\\\"";
        break;
      case '\b':
        out << "\\b";
        break;
      case '\f':
        out << "\\f";
        break;
      case '\n':
        out << "\\n";
        break;
      case '\r':
        out << "\\r";
        break;
      case '\t':
        out << "\\t";
        break;
      default:
        if (static_cast<unsigned char>(ch) < 0x20) {
          const auto byte = static_cast<unsigned char>(ch);
          out << "\\u";
          out << std::hex << std::setw(4) << std::setfill('0')
              << static_cast<int>(byte) << std::dec;
        } else {
          out << ch;
        }
        break;
    }
  }
  return out.str();
}

/**
 * Convert capture groups into a JSON array string.
 */
std::string serializeCaptures(const std::smatch& match) {
  std::ostringstream out;
  out << '[';
  for (std::size_t i = 1; i < match.size(); ++i) {
    if (i > 1) {
      out << ',';
    }
    if (match[i].matched) {
      out << '"' << jsonEscape(match[i].str()) << '"';
    } else {
      out << "null";
    }
  }
  out << ']';
  return out.str();
}

}  // namespace
