# Wait For Element - Improved Implementation

## Changes Made

1. **Better visibility detection**: Now checks for:
   - CSS display: none
   - CSS visibility: hidden
   - CSS opacity: 0
   - Element dimensions (width/height > 0)
   - Element position in viewport

2. **Improved debugging**: Returns JSON with detailed information:
   - Whether element was found
   - Reason for success/failure
   - Details about element state (display, visibility, dimensions)

3. **Better error messages**: When timeout occurs, provides specific information about why the element wasn't considered "found"

## Test Cases

To test the improved wait_for_element function:

### Basic element check (visible=false):
```
Use the safari navigate tool to open https://example.com
Use the safari wait_for_element tool with selector "body" and visible false
```

### Visible element check:
```
Use the safari navigate tool to open https://example.com
Use the safari wait_for_element tool with selector "h1"
```

### Input field check:
```
Use the safari navigate tool to open https://google.com
Use the safari wait_for_element tool with selector "input[type='text']"
```

### Non-existent element (should timeout with clear message):
```
Use the safari wait_for_element tool with selector "#non-existent-element" and timeout 3000
```

## Expected Behavior

- Elements that exist but are hidden will be reported as "Element exists but is not visible"
- Visible elements will be found quickly with message "Element is visible"
- Non-existent elements will timeout with clear error message
- The function now handles complex selectors with quotes properly