"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/email-validator";
exports.ids = ["vendor-chunks/email-validator"];
exports.modules = {

/***/ "(rsc)/./node_modules/email-validator/index.js":
/*!***********************************************!*\
  !*** ./node_modules/email-validator/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\nvar tester = /^[-!#$%&'*+\\/0-9=?A-Z^_a-z{|}~](\\.?[-!#$%&'*+\\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\\.?[a-zA-Z0-9])*\\.[a-zA-Z](-?[a-zA-Z0-9])+$/;\n// Thanks to:\n// http://fightingforalostcause.net/misc/2006/compare-email-regex.php\n// http://thedailywtf.com/Articles/Validating_Email_Addresses.aspx\n// http://stackoverflow.com/questions/201323/what-is-the-best-regular-expression-for-validating-email-addresses/201378#201378\nexports.validate = function(email) {\n    if (!email) return false;\n    if (email.length > 254) return false;\n    var valid = tester.test(email);\n    if (!valid) return false;\n    // Further checking of some things regex can't handle\n    var parts = email.split(\"@\");\n    if (parts[0].length > 64) return false;\n    var domainParts = parts[1].split(\".\");\n    if (domainParts.some(function(part) {\n        return part.length > 63;\n    })) return false;\n    return true;\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZW1haWwtdmFsaWRhdG9yL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFhO0FBRWIsSUFBSUEsU0FBUztBQUNiLGFBQWE7QUFDYixxRUFBcUU7QUFDckUsa0VBQWtFO0FBQ2xFLDZIQUE2SDtBQUM3SEMsZ0JBQWdCLEdBQUcsU0FBU0UsS0FBSztJQUVoQyxJQUFJLENBQUNBLE9BQ0osT0FBTztJQUVSLElBQUdBLE1BQU1DLE1BQU0sR0FBQyxLQUNmLE9BQU87SUFFUixJQUFJQyxRQUFRTCxPQUFPTSxJQUFJLENBQUNIO0lBQ3hCLElBQUcsQ0FBQ0UsT0FDSCxPQUFPO0lBRVIscURBQXFEO0lBQ3JELElBQUlFLFFBQVFKLE1BQU1LLEtBQUssQ0FBQztJQUN4QixJQUFHRCxLQUFLLENBQUMsRUFBRSxDQUFDSCxNQUFNLEdBQUMsSUFDbEIsT0FBTztJQUVSLElBQUlLLGNBQWNGLEtBQUssQ0FBQyxFQUFFLENBQUNDLEtBQUssQ0FBQztJQUNqQyxJQUFHQyxZQUFZQyxJQUFJLENBQUMsU0FBU0MsSUFBSTtRQUFJLE9BQU9BLEtBQUtQLE1BQU0sR0FBQztJQUFJLElBQzNELE9BQU87SUFFUixPQUFPO0FBQ1IiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9pbnRlcnZpZXd2ZXJzZS1mcm9udGVuZC8uL25vZGVfbW9kdWxlcy9lbWFpbC12YWxpZGF0b3IvaW5kZXguanM/YWVkOCJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciB0ZXN0ZXIgPSAvXlstISMkJSYnKitcXC8wLTk9P0EtWl5fYS16e3x9fl0oXFwuP1stISMkJSYnKitcXC8wLTk9P0EtWl5fYS16YHt8fX5dKSpAW2EtekEtWjAtOV0oLSpcXC4/W2EtekEtWjAtOV0pKlxcLlthLXpBLVpdKC0/W2EtekEtWjAtOV0pKyQvO1xyXG4vLyBUaGFua3MgdG86XHJcbi8vIGh0dHA6Ly9maWdodGluZ2ZvcmFsb3N0Y2F1c2UubmV0L21pc2MvMjAwNi9jb21wYXJlLWVtYWlsLXJlZ2V4LnBocFxyXG4vLyBodHRwOi8vdGhlZGFpbHl3dGYuY29tL0FydGljbGVzL1ZhbGlkYXRpbmdfRW1haWxfQWRkcmVzc2VzLmFzcHhcclxuLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yMDEzMjMvd2hhdC1pcy10aGUtYmVzdC1yZWd1bGFyLWV4cHJlc3Npb24tZm9yLXZhbGlkYXRpbmctZW1haWwtYWRkcmVzc2VzLzIwMTM3OCMyMDEzNzhcclxuZXhwb3J0cy52YWxpZGF0ZSA9IGZ1bmN0aW9uKGVtYWlsKVxyXG57XHJcblx0aWYgKCFlbWFpbClcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFxyXG5cdGlmKGVtYWlsLmxlbmd0aD4yNTQpXHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdHZhciB2YWxpZCA9IHRlc3Rlci50ZXN0KGVtYWlsKTtcclxuXHRpZighdmFsaWQpXHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdC8vIEZ1cnRoZXIgY2hlY2tpbmcgb2Ygc29tZSB0aGluZ3MgcmVnZXggY2FuJ3QgaGFuZGxlXHJcblx0dmFyIHBhcnRzID0gZW1haWwuc3BsaXQoXCJAXCIpO1xyXG5cdGlmKHBhcnRzWzBdLmxlbmd0aD42NClcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHJcblx0dmFyIGRvbWFpblBhcnRzID0gcGFydHNbMV0uc3BsaXQoXCIuXCIpO1xyXG5cdGlmKGRvbWFpblBhcnRzLnNvbWUoZnVuY3Rpb24ocGFydCkgeyByZXR1cm4gcGFydC5sZW5ndGg+NjM7IH0pKVxyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cclxuXHRyZXR1cm4gdHJ1ZTtcclxufSJdLCJuYW1lcyI6WyJ0ZXN0ZXIiLCJleHBvcnRzIiwidmFsaWRhdGUiLCJlbWFpbCIsImxlbmd0aCIsInZhbGlkIiwidGVzdCIsInBhcnRzIiwic3BsaXQiLCJkb21haW5QYXJ0cyIsInNvbWUiLCJwYXJ0Il0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/email-validator/index.js\n");

/***/ })

};
;