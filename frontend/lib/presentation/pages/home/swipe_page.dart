import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories/swipe_repository.dart';
import '../../widgets/swipe_card.dart';

class SwipePage extends StatefulWidget {
  const SwipePage({super.key});

  @override
  State<SwipePage> createState() => _SwipePageState();
}

class _SwipePageState extends State<SwipePage> {
  final SwipeRepository _repo = SwipeRepository();
  final List<UserModel> _cards = [];
  bool _loading = true;
  String? _error;

  Offset _drag = Offset.zero;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final recs = await _repo.getRecommendations(limit: 15);
      setState(() {
        _cards
          ..clear()
          ..addAll(recs);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _swipeTop(String type) async {
    if (_cards.isEmpty) return;
    final user = _cards.first;
    setState(() {
      _cards.removeAt(0);
      _drag = Offset.zero;
    });
    try {
      final result = await _repo.swipe(user.id, type);
      if (result.matched && mounted) {
        _showMatch(user);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
    if (_cards.isEmpty) _load();
  }

  void _showMatch(UserModel user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("It's a match! 🎉"),
        content: Text('You and ${user.name} liked each other.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep swiping'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Discover')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _message(_error!, retry: true)
              : _cards.isEmpty
                  ? _message('No more profiles nearby', retry: true)
                  : _buildStack(),
    );
  }

  Widget _buildStack() {
    final dx = _drag.dx;
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              if (_cards.length > 1)
                Positioned.fill(
                  child: Transform.scale(scale: 0.95, child: SwipeCard(user: _cards[1])),
                ),
              Positioned.fill(
                child: GestureDetector(
                  onPanUpdate: (d) => setState(() => _drag += d.delta),
                  onPanEnd: (_) {
                    if (dx > 120) {
                      _swipeTop('LIKE');
                    } else if (dx < -120) {
                      _swipeTop('NOPE');
                    } else {
                      setState(() => _drag = Offset.zero);
                    }
                  },
                  child: Transform.translate(
                    offset: _drag,
                    child: Transform.rotate(
                      angle: dx * 0.0008,
                      child: Stack(
                        children: [
                          SwipeCard(user: _cards.first),
                          if (dx > 40)
                            const Positioned(
                              top: 40,
                              left: 32,
                              child: SwipeLabel(text: 'LIKE', color: AppColors.primary),
                            ),
                          if (dx < -40)
                            const Positioned(
                              top: 40,
                              right: 32,
                              child: SwipeLabel(text: 'NOPE', color: AppColors.error),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 40),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              SwipeActionButton(icon: Icons.close, color: AppColors.error, onPressed: () => _swipeTop('NOPE')),
              SwipeActionButton(icon: Icons.star, color: AppColors.accent, onPressed: () => _swipeTop('SUPER_LIKE')),
              SwipeActionButton(icon: Icons.favorite, color: AppColors.primary, onPressed: () => _swipeTop('LIKE')),
            ],
          ),
        ),
      ],
    );
  }

  Widget _message(String text, {bool retry = false}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 72, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(text, style: Theme.of(context).textTheme.titleMedium),
          if (retry) ...[
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _load, child: const Text('Refresh')),
          ],
        ],
      ),
    );
  }
}
