import axios from 'axios';

const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const importGithubRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: "Repository URL is required" });
    }

    let cleanUrl = repoUrl.trim();
    if (cleanUrl.endsWith('.git')) cleanUrl = cleanUrl.slice(0, -4);
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    const urlParts = cleanUrl.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) {
      return res.status(400).json({ error: "Invalid GitHub repository URL" });
    }
    const owner = urlParts[urlParts.length - 2];
    const repo = urlParts[urlParts.length - 1];

    const headers = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Get default branch
    const repoRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const defaultBranch = repoRes.data.default_branch;

    // 2. Get tree
    const treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    const tree = treeRes.data.tree;
    const pathMap = new Map();
    const files = [];

    tree.forEach(item => {
      if (item.type !== 'blob' && item.type !== 'tree') return;

      const parts = item.path.split('/');
      const name = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1).join('/');
      const parentId = parentPath === '' ? null : pathMap.get(parentPath);

      const id = generateId();
      pathMap.set(item.path, id);

      const extension = name.split('.').pop()?.toLowerCase();
      files.push({
        id,
        name,
        type: item.type === 'tree' ? 'folder' : 'file',
        parentId,
        path: item.path,
        githubMeta: item.type === 'blob' ? { owner, repo, branch: defaultBranch, path: item.path } : null,
        code: item.type === 'blob' ? null : undefined, // null means not fetched
        language: item.type === 'blob' ? getExpectedLanguage(extension) : undefined
      });
    });

    const ignoreList = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
    const filteredFiles = files.filter(f => !ignoreList.some(ignore => f.path.startsWith(ignore + '/') || f.path === ignore));

    res.json({
      success: true,
      files: filteredFiles
    });

  } catch (error) {
    console.error("GitHub import error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to import repository. Please check the URL or try again later." });
  }
};

function getExpectedLanguage(extension) {
  const map = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp', html: 'html', css: 'css', json: 'json', md: 'markdown', go: 'go', rs: 'rust' };
  return map[extension] || 'plaintext';
}
