/**
 * Get the appropriate Monaco editor language from a file extension
 * @param {string} filename - The name of the file
 * @returns {string} - The Monaco editor language identifier
 */
export const getLanguageFromFilename = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const extensionMap = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Python
    'py': 'python',
    'pyw': 'python',
    'pyi': 'python',
    
    // Java
    'java': 'java',
    
    // C/C++
    'c': 'c',
    'h': 'c',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'hpp': 'cpp',
    'hxx': 'cpp',
    
    // C#
    'cs': 'csharp',
    
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Data formats
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    
    // Shell
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    
    // Other languages
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'r': 'r',
    'sql': 'sql',
    'md': 'markdown',
    'markdown': 'markdown',
    'lua': 'lua',
    'perl': 'perl',
    'pl': 'perl',
    'dart': 'dart',
    
    // Config files
    'ini': 'ini',
    'cfg': 'ini',
    'conf': 'ini',
    'dockerfile': 'dockerfile',
    
    // Text
    'txt': 'plaintext',
  };
  
  return extensionMap[extension] || 'plaintext';
};

/**
 * Get a file icon class or emoji based on extension
 * @param {string} filename 
 * @returns {string}
 */
export const getFileIcon = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    'js': '📜',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'py': '🐍',
    'java': '☕',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'md': '📝',
    'cpp': '⚙️',
    'c': '⚙️',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',
    'rb': '💎',
    'swift': '🕊️',
    'sql': '🗄️',
  };
  
  return iconMap[extension] || '📄';
};

/**
 * Generate a unique file ID
 * @returns {string}
 */
export const generateFileId = () => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate filename
 * @param {string} filename 
 * @returns {boolean}
 */
export const isValidFilename = (filename) => {
  if (!filename || filename.trim() === '') return false;
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filename)) return false;
  
  // Check for reserved names (Windows)
  const reservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  const nameWithoutExt = filename.split('.')[0];
  if (reservedNames.test(nameWithoutExt)) return false;
  
  return true;
};

/**
 * Get default code template for a language
 * @param {string} language 
 * @param {string} filename 
 * @returns {string}
 */
export const getDefaultTemplate = (language, filename = '') => {
  const templates = {
    javascript: `// ${filename}\nconsole.log('Hello, World!');\n`,
    typescript: `// ${filename}\nconst message: string = 'Hello, World!';\nconsole.log(message);\n`,
    python: `# ${filename}\nprint('Hello, World!')\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
    cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n`,
    c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
    html: `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n`,
    css: `/* ${filename} */\nbody {\n    margin: 0;\n    padding: 0;\n    font-family: sans-serif;\n}\n`,
    go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
    rust: `fn main() {\n    println!("Hello, World!");\n}\n`,
    php: `<?php\n\necho "Hello, World!";\n\n?>\n`,
    ruby: `# ${filename}\nputs "Hello, World!"\n`,
    sql: `-- ${filename}\nSELECT 'Hello, World!' AS message;\n`,
  };
  
  return templates[language] || `// ${filename}\n`;
};
