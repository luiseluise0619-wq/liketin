import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../data/repositories/match_repository.dart';
import '../chat/chat_page.dart';

class MatchPage extends StatefulWidget {
  const MatchPage({super.key});

  @override
  State<MatchPage> createState() => _MatchPageState();
}

class _MatchPageState extends State<MatchPage> {
  final MatchRepository _repo = MatchRepository();
  late Future<List<MatchSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = _repo.getMatches();
  }

  Future<void> _refresh() async {
    setState(() => _future = _repo.getMatches());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Matches')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<MatchSummary>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              return _centered('Could not load matches');
            }
            final matches = snapshot.data ?? const [];
            if (matches.isEmpty) {
              return _centered('No matches yet — keep swiping!');
            }
            return GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.72,
              ),
              itemCount: matches.length,
              itemBuilder: (context, i) => _tile(matches[i]),
            );
          },
        ),
      ),
    );
  }

  Widget _tile(MatchSummary m) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ChatPage(
            matchId: m.matchId,
            otherName: m.name,
            otherPhoto: m.photoUrl,
            otherUserId: m.userId,
          ),
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (m.photoUrl.isNotEmpty)
              CachedNetworkImage(imageUrl: m.photoUrl, fit: BoxFit.cover)
            else
              Container(color: Colors.grey.shade300, child: const Icon(Icons.person, size: 48)),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black87],
                  stops: [0.6, 1.0],
                ),
              ),
            ),
            Positioned(
              left: 10,
              right: 10,
              bottom: 10,
              child: Row(
                children: [
                  if (m.isOnline)
                    Container(
                      width: 10,
                      height: 10,
                      margin: const EdgeInsets.only(right: 6),
                      decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                    ),
                  Expanded(
                    child: Text(
                      m.name,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _centered(String text) => ListView(
        children: [
          const SizedBox(height: 200),
          Center(child: Text(text, style: Theme.of(context).textTheme.titleMedium)),
        ],
      );
}
