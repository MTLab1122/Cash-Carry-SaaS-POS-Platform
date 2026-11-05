import 'package:flutter/material.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales & Revenue Analytics'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Weekly Sales Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Weekly Sales Breakdown', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  _buildReportRow('Monday', 'PKR 45,000'),
                  _buildReportRow('Tuesday', 'PKR 62,000'),
                  _buildReportRow('Wednesday', 'PKR 58,000'),
                  _buildReportRow('Thursday', 'PKR 75,000'),
                  _buildReportRow('Friday', 'PKR 120,000'),
                  _buildReportRow('Saturday', 'PKR 145,000'),
                  _buildReportRow('Sunday', 'PKR 110,000'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Category Shares
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Sales by Category', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  _buildReportRow('Groceries', '42%'),
                  _buildReportRow('Beverages', '28%'),
                  _buildReportRow('Snacks & Biscuits', '18%'),
                  _buildReportRow('Others', '12%'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black87, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }
}
