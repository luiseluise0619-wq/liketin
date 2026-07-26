import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories/swipe_repository.dart';
import '../../widgets/swipe_card.dart';

/// "One a day" home: a single curated pick per day. After acting (like/pass)
/// the card is spent until midnight, shown as a countdown.
class DailyPickPage extends StatefulWidget {
  const DailyPickPage({super.key});

  @override
  State<DailyPickPage> createState() => _DailyPickPageState();
}

class _DailyPickPageState extends State<DailyPickPage> {
  final SwipeRepository _repo = SwipeRepository();
  DailyPick? _daily;
  bool _loading = true;
  bool _acting = false;
  String? _error;
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final daily = await _repo.getDailyPick();
      setState(() {
        _daily = daily;
        _loading = false;
      });
      _startCountdown(daily.resetAt);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _startCountdown(DateTime? resetAt) {
    _timer?.cancel();
    if (resetAt == null) return;
    void tick() {
      final diff = resetAt.difference(DateTime.now());
      setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
      if (diff.isNegative) {
        _timer?.cancel();
        _load(); // new day → fetch a fresh pick
      }
    }

    tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  Future<void> _act(String type) async {
    final user = _daily?.pick;
    if (user == null || _acting) return;
    setState(() => _acting = true);
    try {
      final result = await _repo.swipe(user.id, type);
      if (result.matched && mounted) _showMatch(user);
      await _load(); // reflect the spent state
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _acting = false);
    }
  }

  void _showMatch(UserModel user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("It's a match! 🎉"),
        content: Text('You and ${user.name} liked each other.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Nice')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Today's One")),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _waiting(icon: Icons.error_outline, title: _error!, retry: true)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final daily = _daily!;
    if (daily.pick != null) {
      return Column(
        children: [
          Expanded(child: SwipeCard(user: daily.pick!)),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 60),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                SwipeActionButton(
                  icon: Icons.close,
                  color: AppColors.error,
                  onPressed: () => _act('NOPE'),
                ),
                SwipeActionButton(
                  icon: Icons.favorite,
                  color: AppColors.primary,
                  onPressed: () => _act('LIKE'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (daily.empty) {
      return _waiting(
        icon: Icons.hourglass_empty,
        title: 'No pick available yet',
        subtitle: 'Set your location and preferences, then check back.',
        retry: true,
      );
    }

    // Already acted → countdown to the next pick.
    return _waiting(
      icon: Icons.check_circle_outline,
      title: "That's your one for today ✓",
      subtitle: 'Next pick in ${_formatDuration(_remaining)}',
    );
  }

  Widget _waiting({
    required IconData icon,
    required String title,
    String? subtitle,
    bool retry = false,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 72, color: AppColors.primary),
            const SizedBox(height: 16),
            Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(subtitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
            ],
            if (retry) ...[
              const SizedBox(height: 20),
              ElevatedButton(onPressed: _load, child: const Text('Refresh')),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDuration(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }
}
