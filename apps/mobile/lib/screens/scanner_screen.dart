import 'package:flutter/material.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final TextEditingController _codeController = TextEditingController();
  Map<String, dynamic>? _scannedProduct;

  void _lookupProduct(String code) {
    // Simulated fast barcode lookup matching database
    if (code == '2000000000018' || code.toLowerCase().contains('app')) {
      setState(() {
        _scannedProduct = {
          'name': 'Apple 1 kg',
          'sku': 'FRU-APP-01',
          'barcode': '2000000000018',
          'retailPrice': 320.0,
          'currentStock': 150,
          'unit': 'KG',
        };
      });
    } else if (code == '2000000000025' || code.toLowerCase().contains('milk')) {
      setState(() {
        _scannedProduct = {
          'name': "Olper's Full Cream Milk 1 Litre",
          'sku': 'DRY-MLK-01',
          'barcode': '2000000000025',
          'retailPrice': 220.0,
          'currentStock': 320,
          'unit': 'PIECE',
        };
      });
    } else {
      setState(() {
        _scannedProduct = {
          'name': 'Scanned Product #$code',
          'sku': 'SKU-$code',
          'barcode': code,
          'retailPrice': 250.0,
          'currentStock': 45,
          'unit': 'PIECE',
        };
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Camera Barcode Scanner'),
        backgroundColor: const Color(0xFF1E40AF),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Simulated Camera Viewfinder
          Container(
            height: 260,
            width: double.infinity,
            color: Colors.black,
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.videocam_outlined, color: Colors.white24, size: 80),
                // Scanner Target Reticle
                Container(
                  width: 200,
                  height: 120,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.redAccent, width: 2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                Positioned(
                  bottom: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black50,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Point camera at product barcode',
                      style: TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Manual Entry Bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _codeController,
                    decoration: InputDecoration(
                      hintText: 'Enter barcode or SKU code...',
                      prefixIcon: const Icon(Icons.barcode_reader),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                    onSubmitted: _lookupProduct,
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _lookupProduct(_codeController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                  child: const Text('Lookup'),
                ),
              ],
            ),
          ),

          // Product Details Card
          if (_scannedProduct != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              _scannedProduct!['name'],
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              "In Stock: ${_scannedProduct!['currentStock']}",
                              style: const TextStyle(
                                color: Color(0xFF16A34A),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Barcode: ${_scannedProduct!['barcode']} | SKU: ${_scannedProduct!['sku']}",
                        style: const TextStyle(color: Colors.grey, fontSize: 12, fontFamily: 'monospace'),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Retail Price:', style: TextStyle(fontSize: 14, color: Colors.black54)),
                          Text(
                            "PKR ${_scannedProduct!['retailPrice']}",
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
