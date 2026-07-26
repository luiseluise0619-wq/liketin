import '../../core/constants/api_constants.dart';
import '../../core/utils/api_client.dart';
import '../models/user_model.dart';

class SwipeResult {
  final bool matched;
  final String? matchId;
  SwipeResult({required this.matched, this.matchId});
}

class DailyPick {
  final UserModel? pick;
  final bool alreadyActed;
  final bool empty;
  final DateTime? resetAt;

  DailyPick({this.pick, this.alreadyActed = false, this.empty = false, this.resetAt});

  factory DailyPick.fromJson(Map<String, dynamic> json) {
    final p = json['pick'];
    return DailyPick(
      pick: p is Map<String, dynamic> ? UserModel.fromJson(p) : null,
      alreadyActed: json['alreadyActed'] == true,
      empty: json['empty'] == true,
      resetAt: json['resetAt'] != null ? DateTime.tryParse(json['resetAt'].toString()) : null,
    );
  }
}

class SwipeRepository {
  final ApiClient _api = ApiClient();

  Future<DailyPick> getDailyPick() async {
    final res = await _api.get('/swipe/daily');
    return DailyPick.fromJson(res as Map<String, dynamic>);
  }

  Future<List<UserModel>> getRecommendations({int limit = 10}) async {
    final res = await _api.get(ApiConstants.recommendations, query: {'limit': limit});
    final list = (res['recommendations'] as List?) ?? const [];
    return list.map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<SwipeResult> swipe(String targetUserId, String type) async {
    final res = await _api.post(ApiConstants.swipe, body: {
      'targetUserId': targetUserId,
      'type': type,
    });
    return SwipeResult(
      matched: res['match'] == true,
      matchId: res['matchId'] as String?,
    );
  }

  Future<void> undo(String targetUserId) async {
    await _api.post(ApiConstants.undoSwipe, body: {'targetUserId': targetUserId});
  }
}
