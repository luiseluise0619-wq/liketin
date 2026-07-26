import '../../core/constants/api_constants.dart';
import '../../core/utils/api_client.dart';

class MatchSummary {
  final String matchId;
  final String userId;
  final String name;
  final String photoUrl;
  final bool isOnline;
  final String? lastMessage;

  MatchSummary({
    required this.matchId,
    required this.userId,
    required this.name,
    required this.photoUrl,
    required this.isOnline,
    this.lastMessage,
  });

  factory MatchSummary.fromJson(Map<String, dynamic> json) {
    final user = (json['user'] as Map<String, dynamic>?) ?? const {};
    final photos = (user['photos'] as List?) ?? const [];
    final lastMsg = json['lastMessage'] as Map<String, dynamic>?;
    return MatchSummary(
      matchId: json['matchId'] as String,
      userId: user['id'] as String? ?? '',
      name: user['name'] as String? ?? '',
      photoUrl: photos.isNotEmpty ? (photos.first['url'] as String? ?? '') : '',
      isOnline: user['isOnline'] as bool? ?? false,
      lastMessage: lastMsg?['content'] as String?,
    );
  }
}

class MatchRepository {
  final ApiClient _api = ApiClient();

  Future<List<MatchSummary>> getMatches() async {
    final res = await _api.get(ApiConstants.matches);
    final list = (res['matches'] as List?) ?? const [];
    return list.map((e) => MatchSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> unmatch(String matchId) async {
    await _api.delete('${ApiConstants.matches}/$matchId');
  }
}
