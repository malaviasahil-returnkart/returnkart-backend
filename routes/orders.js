const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');

// In-memory store for development — swap with MongoDB model in production
let ordersStore = [];

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Returns all orders, optionally filtered by platform or status
router.get('/', (req, res) => {
  const { platform, status, expiring_soon } = req.query;
  let results = [...ordersStore];

  if (platform) {
    results = results.filter(o => o.platform?.toLowerCase() === platform.toLowerCase());
  }

  if (status) {
    results = results.filter(o => o.emailType === status);
  }

  if (expiring_soon === 'true') {
    // Return orders where deadline is within 3 days
    results = results.filter(o => o.daysRemaining >= 0 && o.daysRemaining <= 3);
  }

  // Sort by returnDeadline ascending (most urgent first)
  results.sort((a, b) => new Date(a.returnDeadline) - new Date(b.returnDeadline));

  res.json({ count: results.length, orders: results });
});

// ─── GET /api/orders/:orderId ─────────────────────────────────────────────────
router.get('/:orderId', (req, res) => {
  const order = ordersStore.find(o => o.orderId === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ─── POST /api/orders/bulk ────────────────────────────────────────────────────
// Receives parsed email array from /api/email/sync and upserts into store
router.post('/bulk', (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: 'orders must be an array' });
  }

  let added = 0;
  let updated = 0;

  for (const order of orders) {
    const idx = ordersStore.findIndex(
      o => o.gmailMessageId === order.gmailMessageId || (o.orderId && o.orderId === order.orderId)
    );

    if (idx === -1) {
      ordersStore.push(order);
      added++;
    } else {
      ordersStore[idx] = { ...ordersStore[idx], ...order };
      updated++;
    }
  }

  res.json({ success: true, added, updated, total: ordersStore.length });
});

// ─── GET /api/orders/summary/stats ───────────────────────────────────────────
// Dashboard stats
router.get('/summary/stats', (req, res) => {
  const total = ordersStore.length;
  const expiringSoon = ordersStore.filter(o => o.daysRemaining >= 0 && o.daysRemaining <= 3).length;
  const expired = ordersStore.filter(o => o.daysRemaining < 0).length;
  const activeReturns = ordersStore.filter(o => o.emailType === 'return').length;
  const pendingRefunds = ordersStore.filter(o => o.emailType === 'refund').length;

  const byPlatform = ordersStore.reduce((acc, o) => {
    acc[o.platform] = (acc[o.platform] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total,
    expiringSoon,
    expired,
    activeReturns,
    pendingRefunds,
    byPlatform,
  });
});

// ─── DELETE /api/orders/:orderId ──────────────────────────────────────────────
router.delete('/:orderId', (req, res) => {
  const before = ordersStore.length;
  ordersStore = ordersStore.filter(o => o.orderId !== req.params.orderId);
  if (ordersStore.length === before) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ success: true, message: `Order ${req.params.orderId} deleted` });
});

module.exports = router;
