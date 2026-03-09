const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// ─── GET /api/orders ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { platform, status, expiring_soon } = req.query;
    const filter = {};

    if (platform) filter.platform = platform;
    if (status) filter.refundStatus = status;
    if (expiring_soon === 'true') {
      filter.daysRemaining = { $gte: 0, $lte: 3 };
    }

    const orders = await Order.find(filter).sort({ returnDeadline: 1, createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/orders/summary/stats ───────────────────────────────────────────
router.get('/summary/stats', async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const expiringSoon = await Order.countDocuments({ daysRemaining: { $gte: 0, $lte: 3 } });
    const expired = await Order.countDocuments({ daysRemaining: { $lt: 0 } });
    const activeReturns = await Order.countDocuments({ emailType: 'return' });
    const pendingRefunds = await Order.countDocuments({ refundStatus: 'pending' });

    const byPlatformAgg = await Order.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } },
    ]);
    const byPlatform = Object.fromEntries(byPlatformAgg.map(p => [p._id, p.count]));

    res.json({ total, expiringSoon, expired, activeReturns, pendingRefunds, byPlatform });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Manual add from dashboard "Add Order" form
router.post('/', async (req, res) => {
  try {
    const { orderNumber, merchant, amount, purchaseDate, status } = req.body;

    if (!orderNumber || !merchant || !amount) {
      return res.status(400).json({ error: 'orderNumber, merchant, and amount are required' });
    }

    const order = await Order.create({
      orderNumber,
      merchant,
      amount: parseFloat(amount),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      status: status || 'delivered',
      refundStatus: 'none',
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/orders/bulk ────────────────────────────────────────────────────
// Bulk upsert from Gmail parser
router.post('/bulk', async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'orders must be an array' });
    }

    let added = 0;
    let updated = 0;

    for (const order of orders) {
      // Map parser fields to model fields
      const doc = {
        orderNumber: order.orderId || order.orderNumber || `PARSED-${Date.now()}`,
        merchant: order.platform || order.merchant || 'Unknown',
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
      };

      if (order.gmailMessageId) {
        const existing = await Order.findOne({ gmailMessageId: order.gmailMessageId });
        if (existing) {
          await Order.updateOne({ gmailMessageId: order.gmailMessageId }, { $set: doc });
          updated++;
        } else {
          await Order.create(doc);
          added++;
        }
      } else {
        await Order.create(doc);
        added++;
      }
    }

    res.json({ success: true, added, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/orders/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await Order.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
