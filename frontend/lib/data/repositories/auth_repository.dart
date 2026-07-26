import '../../core/constants/api_constants.dart';
import '../../core/utils/api_client.dart';
import '../../services/storage_service.dart';

class AuthRepository {
  final ApiClient _api = ApiClient();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _api.post(ApiConstants.login, body: {
      'email': email,
      'password': password,
    });
    await _persist(res);
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    final res = await _api.post(ApiConstants.register, body: data);
    await _persist(res);
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> socialLogin(String provider, String idToken) async {
    final res = await _api.post(ApiConstants.socialLogin, body: {
      'provider': provider,
      'idToken': idToken,
    });
    await _persist(res);
    return res as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    final res = await _api.get(ApiConstants.profile);
    return res as Map<String, dynamic>;
  }

  Future<void> logout() async {
    final refreshToken = await StorageService.getRefreshToken();
    if (refreshToken != null) {
      try {
        await _api.post('/auth/logout', body: {'refreshToken': refreshToken});
      } catch (_) {
        // Best-effort server-side revocation; always clear locally.
      }
    }
    await StorageService.clearTokens();
    ApiClient().clearToken();
  }

  Future<bool> restoreSession() async {
    final token = await StorageService.getAccessToken();
    if (token == null) return false;
    ApiClient().setToken(token);
    return true;
  }

  Future<void> _persist(dynamic res) async {
    if (res is Map && res['accessToken'] != null && res['refreshToken'] != null) {
      await StorageService.setTokens(res['accessToken'], res['refreshToken']);
      ApiClient().setToken(res['accessToken']);
    }
  }
}
