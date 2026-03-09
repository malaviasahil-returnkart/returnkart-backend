const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');

// In-memory store for development — swap with MongoDB model in production
let ordersStore = [];

// ─── GET /api/orders ──────────────────────────────────────────────────────────
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
    results = results.filter(o => o.daysRemaining >= 0 && o.daysRemaining <= 3);
  }

  // Sort by returnDeadline ascending (most urgent first)
  results.sort((a, b) => new Date(a.returnDeadline) - new Date(b.returnDeadline));

  // Return plain array so frontend can call .reduce(), .filter() etc directly
  res.json(results);
});

// ─── GET /api/orders/summary/stats ───────────────────────────────────────────
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

  res.json({ total, expiringSoon, expired, activeReturns, pendingRefunds, byPlatform });
});

// ─── GET /api/orders/:orderId ─────────────────────────────────────────────────
router.get('/:orderId', (req, res) => {
  const order = ordersStore.find(o => o.orderId === req.params.orderId || String(o.id) === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Add a single order (called from dashboard "Add Order" form)
router.post('/', (req, res) => {
  const { orderNumber, merchant, amount, purchaseDate, status } = req.body;

  if (!orderNumber || !merchant || !amount) {
    return res.status(400).json({ error: 'orderNumber, merchant, and amount are required' });
  }

  const order = {
    id: Date.now(),
    orderNumber,
    merchant,
    amount: parseFloat(amount),
    purchaseDate: purchaseDate || new Date().toISOString(),
    status: status || 'delivered',
    refundStatus: 'none',
    refundAmount: null,
    platform: merchant,
    createdAt: new Date().toISOString(),
  };

  ordersStore.push(order);
  res.status(201).json(order);
});

// ─── POST /api/orders/bulk ────────────────────────────────────────────────────
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
      ordersStore.push({ id: Date.now(), ...order });
      added++;
    } else {
      ordersStore[idx] = { ...ordersStore[idx], ...order };
      updated++;
    }
  }

  res.json({ success: true, added, updated, total: ordersStore.length });
});

// ─── DELETE /api/orders/:orderId ──────────────────────────────────────────────
router.delete('/:orderId', (req, res) => {
  const before = ordersStore.length;
  ordersStore = ordersStore.filter(
    o => o.orderId !== req.params.orderId && String(o.id) !== req.params.orderId
  );
  if (ordersStore.length === before) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ success: true });
});

module.exports = router;
