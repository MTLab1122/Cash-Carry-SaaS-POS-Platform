import 'package:flutter/material.dart';

class InventoryScreen extends StatefulWidget {
  final bool lowStockOnly;
  const InventoryScreen({super.key, this.lowStockOnly = false});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  late bool _lowStockOnly;
  String _search = '';

  final List<Map<String, dynamic>> _mockInventory = [
    {
      'name': 'Apple 1 kg',
      'sku': 'FRU-APP-01',
      'barcode': '2000000000018',
      'currentStock': 150,
      'minStock': 20,
      'price': 320.0,
      'unit': 'KG',
      'isLow': false,
    },
    {
      'name': "Olper's Full Cream Milk 1 Litre",
      'sku': 'DRY-MLK-01',
      'barcode': '2000000000025',
      'currentStock': 320,
      'minStock': 30,
      'price': 220.0,
      'unit': 'PIECE',
      'isLow': false,
    },
    {
      'name': 'Dalda Premium Cooking Oil 5L',
      'sku': 'GRC-OIL-01',
      'barcode': '2000000000056',
      'currentStock': 8,
      'minStock': 10,
      'price': 2650.0,
      'unit': 'PIECE',
      'isLow': true,
    },
    {
      'name': 'Super Kernel Basmati Rice 5kg',
      'sku': 'GRC-RICE-01',
      'barcode': '2000000000100',
      'currentStock': 12,
      'minStock': 15,
      'price': 1850.0,
      'unit': 'PACK',
      'isLow': true,
    },
    {
      'name': 'Shan Bombay Biryani Masala 50g',
      'sku': 'GRC-SHN-01',
      'barcode': '2000000000049',
      'currentStock': 450,
      'minStock': 50,
      'price': 110.0,
      'unit': 'PIECE',
      'isLow': false,
    },
  ];

  @override
  void initState() {
    super.initState();
    _lowStockOnly = widget.lowStockOnly;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _mockInventory.where((item) {
      if (_lowStockOnly && !item['isLow']) return false;
      if (_search.isNotEmpty && !item['name'].toLowerCase().contains(_search.toLowerCase())) return false;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory & Stock'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Filter & Search Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search products by name or SKU...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                  onChanged: (val) => setState(() => _search = val),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    FilterChip(
                      selected: _lowStockOnly,
                      label: const Text('Low Stock Alerts'),
                      avatar: const Icon(Icons.warning, size: 16),
                      onSelected: (val) => setState(() => _lowStockOnly = val),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Inventory List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final item = filtered[index];
                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                  title: Text(item['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text("SKU: ${item['sku']} | PKR ${item['price']}", style: const TextStyle(fontSize: 12)),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: item['isLow'] ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "${item['currentStock']} ${item['unit']}",
                      style: TextStyle(
                        color: item['isLow'] ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

