import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/api_client.dart';

class PremiumPage extends StatefulWidget {
  const PremiumPage({super.key});

  @override
  State<PremiumPage> createState() => _PremiumPageState();
}

class _PremiumPageState extends State<PremiumPage> {
  late Future<List<Map<String, dynamic>>> _future;
  String? _subscribingId;

  @override
  void initState() {
    super.initState();
    _future = _loadPlans();
  }

  Future<List<Map<String, dynamic>>> _loadPlans() async {
    final res = await ApiClient().get('/premium/plans');
    return ((res['plans'] as List?) ?? const []).cast<Map<String, dynamic>>();
  }

  Future<void> _subscribe(Map<String, dynamic> plan) async {
    setState(() => _subscribingId = plan['id'] as String?);
    try {
      // Step 1: create the payment intent.
      final intent = await ApiClient().post('/premium/subscribe', body: {'planId': plan['id']});

      // Step 2: confirm payment. In sandbox mode the intent auto-succeeds; with
      // real Stripe the app would first present the payment sheet using
      // intent['clientSecret'] before calling /confirm.
      if (intent['sandbox'] != true) {
        // TODO: present Stripe payment sheet with intent['clientSecret'] here.
      }
      await ApiClient().post('/premium/confirm', body: {
        'planId': plan['id'],
        'intentId': intent['intentId'],
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${plan['name']} activated 🎉')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _subscribingId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Get Premium')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final plans = snapshot.data ?? const [];
          if (plans.isEmpty) {
            return const Center(child: Text('No plans available'));
          }
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Icon(Icons.workspace_premium, size: 64, color: AppColors.primary),
              const SizedBox(height: 8),
              Text(
                'Upgrade your experience',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 24),
              ...plans.map(_planCard),
            ],
          );
        },
      ),
    );
  }

  Widget _planCard(Map<String, dynamic> plan) {
    final features = (plan['features'] as List?) ?? const [];
    final busy = _subscribingId == plan['id'];
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.primary, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(plan['name']?.toString() ?? '',
                    style: Theme.of(context).textTheme.titleLarge),
                Text(
                  '\$${plan['price']}/mo',
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...features.map((f) {
              final included = f is Map && f['included'] == true;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Icon(
                      included ? Icons.check_circle : Icons.cancel,
                      size: 18,
                      color: included ? AppColors.success : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(f is Map ? '${f['feature']}' : '$f')),
                  ],
                ),
              );
            }),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: busy ? null : () => _subscribe(plan),
                child: busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text('Choose ${plan['name']}'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
