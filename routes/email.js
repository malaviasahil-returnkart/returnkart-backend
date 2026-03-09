const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { fetchOrderEmails, getOAuthClient } = require('../parsers/gmailParser');

// ─── GET /api/email/auth-url ───────────────────────────────────────────────────
// Returns the Google OAuth2 URL the user must visit to grant Gmail access
router.get('/auth-url', (req, res) => {
  const auth = getOAuthClient();
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
  res.json({ url });
});

// ─── GET /api/email/callback ──────────────────────────────────────────────────
// OAuth2 callback — exchanges auth code for tokens
router.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing auth code' });

  try {
    const auth = getOAuthClient();
    const { tokens } = await auth.getToken(code);
    // In production: encrypt and store tokens per user in DB
    res.json({
      message: 'Gmail access granted',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).json({ error: 'Failed to exchange auth code' });
  }
});

// ─── POST /api/email/sync ─────────────────────────────────────────────────────
// Fetches and parses order emails from Gmail
// Body: { access_token: string, max_results?: number }
router.post('/sync', async (req, res) => {
  const { access_token, max_results = 50 } = req.body;

  if (!access_token) {
    return res.status(401).json({ error: 'access_token required' });
  }

  try {
    const orders = await fetchOrderEmails(access_token, max_results);
    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('Email sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync emails', details: err.message });
  }
});

// ─── POST /api/email/refresh-token ───────────────────────────────────────────
// Refreshes an expired access token using a refresh token
// Body: { refresh_token: string }
router.post('/refresh-token', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

  try {
    const auth = getOAuthClient();
    auth.setCredentials({ refresh_token });
    const { credentials } = await auth.refreshAccessToken();
    res.json({
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
    });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;
