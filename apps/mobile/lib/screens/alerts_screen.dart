import 'package:flutter/material.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications & Alerts'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildAlertTile(
            icon: Icons.warning_amber_rounded,
            color: Colors.amber,
            title: 'Low Stock Alert: Dalda Cooking Oil 5L',
            subtitle: 'Only 8 units remaining in Central Warehouse. Reorder threshold is 10 units.',
            time: '10m ago',
          ),
          _buildAlertTile(
            icon: Icons.warning_amber_rounded,
            color: Colors.amber,
            title: 'Low Stock Alert: Basmati Rice 5kg',
            subtitle: '12 packs remaining. Recommended reorder is 40 packs for weekend demand.',
            time: '1h ago',
          ),
          _buildAlertTile(
            icon: Icons.check_circle_outline,
            color: Colors.green,
            title: 'FBR POS Sync Verified',
            subtitle: 'All 84 cashier checkout invoices successfully reported to FBR Tier-1 server.',
            time: '3h ago',
          ),
          _buildAlertTile(
            icon: Icons.point_of_sale,
            color: Colors.blue,
            title: 'Shift Opened: Counter 1 (Gulberg)',
            subtitle: 'Cashier Fatima Noor opened shift with PKR 15,000 float.',
            time: '5h ago',
          ),
        ],
      ),
    );
  }

  Widget _buildAlertTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String time,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                      Text(time, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(color: Colors.black87, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

