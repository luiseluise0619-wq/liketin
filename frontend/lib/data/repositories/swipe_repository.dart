import '../../core/constants/api_constants.dart';
import '../../core/utils/api_client.dart';
import '../models/user_model.dart';

class SwipeResult {
  final bool matched;
  final String? matchId;
  SwipeResult({required this.matched, this.matchId});
}

class SwipeRepository {
  final ApiClient _api = ApiClient();

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
