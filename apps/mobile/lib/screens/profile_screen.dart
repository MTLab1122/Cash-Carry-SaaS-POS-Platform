import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store & User Profile'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: const Color(0xFF2563EB),
                  child: const Text('M', style: TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(height: 12),
                const Text('Muhammad Tariq', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Text('Business Owner (Admin)', style: TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Column(
              children: const [
                ListTile(
                  leading: Icon(Icons.business, color: Color(0xFF2563EB)),
                  title: Text('Business Name', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  subtitle: Text('ABC Mart & Cash Carry Pvt Ltd', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
                Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.location_on_outlined, color: Color(0xFF2563EB)),
                  title: Text('Active Branch', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  subtitle: Text('Gulberg Superstore (Main Branch), Lahore', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
                Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.verified, color: Colors.green),
                  title: Text('FBR Status', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  subtitle: Text('Tier-1 POS Integrated (NTN: 7654321-9)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
                Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.currency_exchange, color: Color(0xFF2563EB)),
                  title: Text('Market Currency', style: TextStyle(fontSize: 13, color: Colors.grey)),
                  subtitle: Text('PKR (Pakistani Rupee)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

