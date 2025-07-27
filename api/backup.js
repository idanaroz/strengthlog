module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Verify environment variables are set
  const { GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPOSITORY } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPOSITORY) {
    return res.status(500).json({
      error: 'Server configuration error: GitHub credentials not configured'
    });
  }

  const githubApiCall = async (endpoint, method = 'GET', data = null) => {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'StrengthLog-Backup/1.0'
    };

    const config = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return await response.json();
  };

  try {
    if (req.method === 'POST') {
      // Handle backup creation
      const { exercises, workouts } = req.body;

      if (!exercises || !workouts) {
        return res.status(400).json({ error: 'Missing workout data' });
      }

      const backupData = {
        exercises,
        workouts,
        backupDate: new Date().toISOString(),
        version: '1.0'
      };

      const fileName = `strength-log-backup-${new Date().toISOString().split('T')[0]}.json`;
      const content = JSON.stringify(backupData, null, 2);

      // Check if file exists
      let sha = null;
      try {
        const existingFile = await githubApiCall(`/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents/${fileName}`, 'GET');
        sha = existingFile.sha;
      } catch (error) {
        // File doesn't exist, that's fine
      }

      // Create or update file
      const fileData = {
        message: `Backup workout data - ${new Date().toLocaleDateString()}`,
        content: Buffer.from(content).toString('base64'),
        sha: sha // Include SHA if updating existing file
      };

      await githubApiCall(`/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents/${fileName}`, 'PUT', fileData);

      return res.status(200).json({
        success: true,
        message: 'Backup created successfully',
        fileName,
        backupDate: backupData.backupDate
      });

    } else if (req.method === 'GET') {
      // Handle backup restoration - list available backups or get latest
      const { action } = req.query;

      if (action === 'list') {
        // List all backup files
        try {
          const files = await githubApiCall(`/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents`);
          const backupFiles = files
            .filter(file => file.name.startsWith('strength-log-backup-') && file.name.endsWith('.json'))
            .map(file => ({
              name: file.name,
              date: file.name.match(/strength-log-backup-(\d{4}-\d{2}-\d{2})\.json/)?.[1] || 'unknown',
              sha: file.sha,
              download_url: file.download_url
            }))
            .sort((a, b) => b.name.localeCompare(a.name));

          return res.status(200).json({ backups: backupFiles });
        } catch (error) {
          return res.status(404).json({ error: 'Repository not found or no access' });
        }

      } else {
        // Get latest backup
        try {
          const files = await githubApiCall(`/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents`);
          const backupFiles = files.filter(file =>
            file.name.startsWith('strength-log-backup-') && file.name.endsWith('.json')
          );

          if (backupFiles.length === 0) {
            return res.status(404).json({ error: 'No backup files found' });
          }

          // Get the most recent backup
          const latestBackup = backupFiles.sort((a, b) => b.name.localeCompare(a.name))[0];

          // Download and parse the backup
          const fileContent = await githubApiCall(`/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents/${latestBackup.name}`);
          const content = Buffer.from(fileContent.content, 'base64').toString('utf8');
          const backupData = JSON.parse(content);

          return res.status(200).json({
            success: true,
            data: backupData,
            fileName: latestBackup.name,
            backupDate: backupData.backupDate
          });

        } catch (error) {
          return res.status(500).json({ error: `Failed to restore backup: ${error.message}` });
        }
      }

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Backup API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}