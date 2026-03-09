const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { fetchOrderEmails, getOAuthClient } = require('../parsers/gmailParser');
const User = require('../models/User');
const Order = require('../models/Order');

// ─── GET /api/email/auth-url ──────────────────────────────────────────────────
// Step 1: Frontend calls this to get the Google login URL
router.get('/auth-url', (req, res) => {
  const auth = getOAuthClient();
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });
  res.json({ url });
});

// ─── GET /api/email/callback ──────────────────────────────────────────────────
// Step 2: Google redirects here after user grants permission
// Exchanges auth code for tokens, saves user to DB, redirects to frontend dashboard
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}?error=access_denied`);
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing auth code' });
  }

  try {
    const auth = getOAuthClient();
    const { tokens } = await auth.getToken(code);
    auth.setCredentials(tokens);

    // Fetch user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const { data: profile } = await oauth2.userinfo.get();

    // Upsert user in MongoDB
    const user = await User.findOneAndUpdate(
      { googleId: profile.id },
      {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      { upsert: true, new: true }
    );

    // Redirect to frontend with userId so frontend knows who's logged in
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/dashboard?userId=${user._id}&email=${encodeURIComponent(user.email)}`);
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}?error=oauth_failed`);
  }
});

// ─── POST /api/email/sync ─────────────────────────────────────────────────────
// Step 3: Sync Gmail orders for a user
// Body: { userId: string }
router.post('/sync', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    // Load user and their tokens from DB
    const user = await User.findById(userId);
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'User not found or not connected to Gmail' });
    }

    // Refresh token if expired
    let accessToken = user.accessToken;
    if (user.tokenExpiry && new Date() > user.tokenExpiry && user.refreshToken) {
      const auth = getOAuthClient();
      auth.setCredentials({ refresh_token: user.refreshToken });
      const { credentials } = await auth.refreshAccessToken();
      accessToken = credentials.access_token;

      // Save refreshed token
      await User.findByIdAndUpdate(userId, {
        accessToken: credentials.access_token,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
      });
    }

    // Fetch and parse emails
    const parsedOrders = await fetchOrderEmails(accessToken, 50);

    // Save to MongoDB — upsert by gmailMessageId
    let added = 0;
    let updated = 0;

    for (const order of parsedOrders) {
      const doc = {
        orderNumber: order.orderId || `PARSED-${Date.now()}`,
        merchant: order.platform || 'Unknown',
        amount: order.amount || 0,
        purchaseDate: order.receivedAt || new Date(),
        gmailMessageId: order.gmailMessageId,
        platform: order.platform,
        emailType: order.emailType,
        orderId: order.orderId,
        productName: order.productName,
        otp: order.otp,
        deliveryDate: order.deliveryDate,
        returnDeadline: order.returnDeadline,
        daysRemaining: order.daysRemaining,
        returnWindowDays: order.returnWindowDays,
        rawSnippet: order.rawSnippet,
        userId: userId,
      };

      const existing = await Order.findOne({ gmailMessageId: order.gmailMessageId });
      if (existing) {
        await Order.updateOne({ gmailMessageId: order.gmailMessageId }, { $set: doc });
        updated++;
      } else {
        await Order.create(doc);
        added++;
      }
    }

    res.json({
      success: true,
      added,
      updated,
      total: parsedOrders.length,
    });
  } catch (err) {
    console.error('Email sync error:', err.message);
    res.status(500).json({ error: 'Failed to sync emails', details: err.message });
  }
});

// ─── POST /api/email/refresh-token ───────────────────────────────────────────
router.post('/refresh-token', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const user = await User.findById(userId);
    if (!user?.refreshToken) return res.status(400).json({ error: 'No refresh token found' });

    const auth = getOAuthClient();
    auth.setCredentials({ refresh_token: user.refreshToken });
    const { credentials } = await auth.refreshAccessToken();

    await User.findByIdAndUpdate(userId, {
      accessToken: credentials.access_token,
      tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    });

    res.json({ success: true, expiry_date: credentials.expiry_date });
  } catch (err) {
    console.error('Token refresh error:', err.message);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// ─── GET /api/email/status/:userId ───────────────────────────────────────────
// Check if a user has Gmail connected
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('email name picture tokenExpiry');
    if (!user) return res.status(404).json({ connected: false });
    res.json({ connected: true, email: user.email, name: user.name, picture: user.picture });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
