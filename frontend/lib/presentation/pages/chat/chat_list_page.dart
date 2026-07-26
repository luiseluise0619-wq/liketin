import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../data/repositories/match_repository.dart';
import 'chat_page.dart';

class ChatListPage extends StatefulWidget {
  const ChatListPage({super.key});

  @override
  State<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends State<ChatListPage> {
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
      appBar: AppBar(title: const Text('Messages')),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: FutureBuilder<List<MatchSummary>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            final matches = snapshot.data ?? const [];
            if (matches.isEmpty) {
              return ListView(children: [
                const SizedBox(height: 200),
                Center(child: Text('No conversations yet', style: Theme.of(context).textTheme.titleMedium)),
              ]);
            }
            return ListView.separated(
              itemCount: matches.length,
              separatorBuilder: (_, __) => const Divider(height: 1, indent: 80),
              itemBuilder: (context, i) {
                final m = matches[i];
                return ListTile(
                  leading: CircleAvatar(
                    radius: 28,
                    backgroundImage: m.photoUrl.isNotEmpty ? CachedNetworkImageProvider(m.photoUrl) : null,
                    child: m.photoUrl.isEmpty ? const Icon(Icons.person) : null,
                  ),
                  title: Text(m.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(
                    m.lastMessage ?? 'Say hi 👋',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
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
                );
              },
            );
          },
        ),
      ),
    );
  }
}
