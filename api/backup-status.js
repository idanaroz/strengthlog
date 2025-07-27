module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if environment variables are configured
    const { GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPOSITORY } = process.env;

    if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPOSITORY) {
      return res.status(200).json({
        configured: false,
        status: 'error',
        message: 'GitHub backup not configured on server'
      });
    }

    // Test GitHub API connection
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'StrengthLog-Backup/1.0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Repository doesn't exist, try to create it
        const createResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'StrengthLog-Backup/1.0'
          },
          body: JSON.stringify({
            name: GITHUB_REPOSITORY,
            description: 'Strength Training Log Backup Data',
            private: true
          })
        });

        if (createResponse.ok) {
          return res.status(200).json({
            configured: true,
            status: 'success',
            message: 'GitHub backup configured and repository created',
            repository: `${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`
          });
        } else {
          return res.status(200).json({
            configured: false,
            status: 'error',
            message: 'Failed to create backup repository'
          });
        }
      } else {
        return res.status(200).json({
          configured: false,
          status: 'error',
          message: 'GitHub authentication failed'
        });
      }
    }

    // Check for existing backups
    let backupCount = 0;
    let latestBackup = null;

    try {
      const contentsResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPOSITORY}/contents`, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'StrengthLog-Backup/1.0'
        }
      });

      if (contentsResponse.ok) {
        const files = await contentsResponse.json();
        const backupFiles = files.filter(file =>
          file.name.startsWith('strength-log-backup-') && file.name.endsWith('.json')
        );

        backupCount = backupFiles.length;

        if (backupFiles.length > 0) {
          const sorted = backupFiles.sort((a, b) => b.name.localeCompare(a.name));
          latestBackup = sorted[0].name.match(/strength-log-backup-(\d{4}-\d{2}-\d{2})\.json/)?.[1] || 'unknown date';
        }
      }
    } catch (error) {
      // Error getting contents, but auth worked, so backup is still configured
    }

    return res.status(200).json({
      configured: true,
      status: 'success',
      message: backupCount > 0
        ? `${backupCount} backup(s) found, latest: ${latestBackup}`
        : 'GitHub backup ready, no backups yet',
      repository: `${GITHUB_USERNAME}/${GITHUB_REPOSITORY}`,
      backupCount,
      latestBackup
    });

  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({
      configured: false,
      status: 'error',
      message: 'Server error checking backup status'
    });
  }
}