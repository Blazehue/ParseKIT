# ParseKIT - JSON/CSV Converter

A lightweight, fast, and modern web-based tool for converting between JSON and CSV formats with bidirectional conversion capabilities, file upload/download, live preview, and validation.

## 🌟 Features

### Core Functionality
- **Bidirectional Conversion**: Convert JSON to CSV and CSV to JSON seamlessly
- **File Upload**: Drag-and-drop or click to upload files (up to 10MB)
- **Manual Input**: Paste or type data directly into the text editor
- **Live Preview**: View converted data in formatted, table, or raw modes
- **Real-time Validation**: Instant feedback on data structure and syntax

### Advanced Features
- **Nested Object Support**: Handles deeply nested JSON structures with dot notation
- **Custom Delimiters**: Choose from comma, semicolon, tab, or pipe delimiters
- **Header Management**: Include/exclude headers, custom header mapping
- **Type Inference**: Automatic detection and conversion of data types
- **Large File Support**: Efficient processing of datasets with chunking
- **Error Recovery**: Robust handling of malformed data with helpful error messages

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Ready**: Beautiful orchid-themed color scheme
- **Keyboard Shortcuts**: Quick actions for power users
- **LocalStorage**: Saves your preferences across sessions
- **Download Options**: Save converted files with custom names
- **Copy to Clipboard**: Quick copy functionality
- **Conversion Reports**: Export statistics and settings

## 🚀 Getting Started

### Quick Start
1. Open `index.html` in a modern web browser
2. Choose conversion direction (JSON → CSV or CSV → JSON)
3. Upload a file or paste your data
4. Click "Convert" to see results
5. Download or copy the converted data

### File Upload
- Supported formats: `.json`, `.csv`
- Maximum file size: 10MB
- Auto-detection of CSV delimiters
- BOM (Byte Order Mark) handling

### Manual Input
- Real-time character and line counting
- Syntax validation as you type
- Clear/reset functionality

## ⚙️ Configuration Options

### CSV Settings
- **Delimiter**: , (comma), ; (semicolon), \t (tab), | (pipe)
- **Line Ending**: LF (\n) or CRLF (\r\n)
- **Include Headers**: Toggle header row
- **Quote Character**: Customize field quoting

### JSON Settings
- **Prettify Output**: Format JSON with indentation
- **Nested Objects**: Flatten or preserve structure
- **Max Nesting Depth**: Control structure depth

## 📊 Supported Data Formats

### JSON Input
```json
[
  {
    "name": "John Doe",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Jane Smith",
    "age": 25,
    "city": "Los Angeles"
  }
]
```

### CSV Output
```csv
name,age,city
John Doe,30,New York
Jane Smith,25,Los Angeles
```

## 🛠️ Technical Stack

- **Pure Vanilla JavaScript** - No external dependencies
- **ES6+ Features** - Modern JavaScript syntax
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **Web APIs** - FileReader, Blob, Clipboard, LocalStorage

## 🎨 Design

### Color Scheme
- Primary: `#DA70D6` (Orchid)
- Accent: `#9370DB` (Medium Purple)
- Background: `#F8F5FA` (Light Lavender)
- Text: `#2D1B3D` (Dark Purple)

### Typography
- Sans-serif: System fonts for UI
- Monospace: Courier New for code display

## 🧪 Testing

### Test Cases
- ✅ Upload JSON array of objects
- ✅ Upload JSON single object
- ✅ Upload nested JSON structures
- ✅ Upload CSV with headers
- ✅ Upload CSV without headers
- ✅ Round-trip conversion (JSON → CSV → JSON)
- ✅ Special characters and quotes handling
- ✅ File size limit validation
- ✅ Manual text input
- ✅ Download functionality
- ✅ Copy to clipboard
- ✅ Responsive design testing

## 📝 Edge Cases Handled

### JSON to CSV
- Circular reference detection
- Inconsistent object properties
- Nested arrays and objects
- Special number values (NaN, Infinity)
- Null and undefined values
- Empty objects and arrays

### CSV to JSON
- Malformed CSV recovery
- Missing fields/columns
- Escaped quotes and delimiters
- BOM handling
- Empty rows
- Trailing commas
- Multi-line fields

## 🔧 Browser Compatibility

- Chrome/Edge: ✅ (latest)
- Firefox: ✅ (latest)
- Safari: ✅ (latest)
- Opera: ✅ (latest)

Requires ES6+ support (2015+)

## 📦 Project Structure

```
Day3/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles
├── js/
│   ├── app.js             # Main application
│   ├── fileHandler.js     # File operations
│   ├── validator.js       # Data validation
│   ├── jsonToCsv.js       # JSON→CSV converter
│   └── csvToJson.js       # CSV→JSON converter
├── assets/                # Images/icons (if any)
└── README.md             # This file
```

## 🎯 Performance

- Handles files up to 10MB
- Chunked processing for large datasets
- Optimized rendering (100-row limit for table view)
- Minimal DOM manipulation
- No external library overhead

## 🐛 Known Limitations

- 10MB file size limit (browser dependent)
- Table preview limited to 100 rows
- Extremely deep nesting (10+ levels) may be simplified
- Very large files may cause browser slowdown

## 🤝 Contributing

This is a learning project. Feel free to:
- Report issues
- Suggest features
- Submit pull requests

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 👨‍💻 Author

Built with ❤️ for developers by the ParseKIT team

## 🔗 Links

- GitHub Repository: [Blazehue/ParseKIT](https://github.com/Blazehue/ParseKIT)
- Live Demo: (Add your deployment URL here)

## 📚 Resources

- [JSON Specification](https://www.json.org/)
- [CSV Format (RFC 4180)](https://tools.ietf.org/html/rfc4180)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Version**: 1.0.0  
**Last Updated**: October 19, 2025
