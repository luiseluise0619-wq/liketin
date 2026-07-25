import 'dart:convert';
import 'package:http/http.dart' as http;

import '../constants/api_constants.dart';
import '../../services/storage_service.dart';

/// Thin REST client with a Bearer token and automatic refresh on 401.
class ApiClient {
  ApiClient._internal();
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  final http.Client _client = http.Client();
  String? _accessToken;

  void setToken(String token) => _accessToken = token;
  void clearToken() => _accessToken = null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
      };

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    final uri = Uri.parse('${ApiConstants.baseApiUrl}$path').replace(
      queryParameters: query?.map((k, v) => MapEntry(k, '$v')),
    );
    return _send(() => _client.get(uri, headers: _headers));
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) => _send(
        () => _client.post(
          Uri.parse('${ApiConstants.baseApiUrl}$path'),
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        ),
      );

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) => _send(
        () => _client.put(
          Uri.parse('${ApiConstants.baseApiUrl}$path'),
          headers: _headers,
          body: body != null ? jsonEncode(body) : null,
        ),
      );

  Future<dynamic> delete(String path) => _send(
        () => _client.delete(
          Uri.parse('${ApiConstants.baseApiUrl}$path'),
          headers: _headers,
        ),
      );

  Future<dynamic> _send(Future<http.Response> Function() request) async {
    var response = await request();
    if (response.statusCode == 401) {
      final body = _tryDecode(response.body);
      if (body is Map && body['code'] == 'TOKEN_EXPIRED' && await _refresh()) {
        response = await request();
      }
    }
    return _handle(response);
  }

  Future<bool> _refresh() async {
    final refreshToken = await StorageService.getRefreshToken();
    if (refreshToken == null) return false;
    final res = await _client.post(
      Uri.parse('${ApiConstants.baseApiUrl}${ApiConstants.refreshToken}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      await StorageService.setTokens(data['accessToken'], data['refreshToken']);
      setToken(data['accessToken']);
      return true;
    }
    return false;
  }

  dynamic _handle(http.Response response) {
    final body = _tryDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) return body;
    final message = body is Map ? (body['error'] ?? 'Unknown error') : 'Unknown error';
    throw ApiException(statusCode: response.statusCode, message: message);
  }

  dynamic _tryDecode(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException({required this.statusCode, required this.message});
  @override
  String toString() => 'ApiException($statusCode): $message';
}
